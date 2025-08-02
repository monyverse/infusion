use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod htlc {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let htlc_account = &mut ctx.accounts.htlc_account;
        htlc_account.authority = ctx.accounts.authority.key();
        htlc_account.bump = *ctx.bumps.get("htlc_account").unwrap();
        Ok(())
    }

    pub fn create_htlc(
        ctx: Context<CreateHTLC>,
        hashlock: [u8; 32],
        timelock: i64,
        amount: u64,
    ) -> Result<()> {
        let htlc = &mut ctx.accounts.htlc;
        let clock = Clock::get()?;

        require!(timelock > clock.unix_timestamp, HTLCError::InvalidTimelock);
        require!(amount > 0, HTLCError::InvalidAmount);

        htlc.sender = ctx.accounts.sender.key();
        htlc.recipient = ctx.accounts.recipient.key();
        htlc.hashlock = hashlock;
        htlc.timelock = timelock;
        htlc.amount = amount;
        htlc.withdrawn = false;
        htlc.refunded = false;
        htlc.created_at = clock.unix_timestamp;

        // Transfer tokens to HTLC account
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.htlc_token_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(HTLCCreated {
            htlc: htlc.key(),
            sender: htlc.sender,
            recipient: htlc.recipient,
            hashlock,
            timelock,
            amount,
        });

        Ok(())
    }

    pub fn redeem_htlc(ctx: Context<RedeemHTLC>, preimage: [u8; 32]) -> Result<()> {
        let htlc = &mut ctx.accounts.htlc;
        let clock = Clock::get()?;

        require!(!htlc.withdrawn, HTLCError::AlreadyWithdrawn);
        require!(!htlc.refunded, HTLCError::AlreadyRefunded);
        require!(htlc.recipient == ctx.accounts.recipient.key(), HTLCError::InvalidRecipient);

        // Verify preimage matches hashlock
        let computed_hashlock = anchor_lang::solana_program::hash::hash(&preimage).to_bytes();
        require!(htlc.hashlock == computed_hashlock, HTLCError::InvalidPreimage);

        htlc.withdrawn = true;
        htlc.preimage = Some(preimage);

        // Transfer tokens to recipient
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.htlc_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.htlc_account.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, htlc.amount)?;

        emit!(HTLCRedeemed {
            htlc: htlc.key(),
            preimage,
            recipient: htlc.recipient,
        });

        Ok(())
    }

    pub fn refund_htlc(ctx: Context<RefundHTLC>) -> Result<()> {
        let htlc = &mut ctx.accounts.htlc;
        let clock = Clock::get()?;

        require!(!htlc.withdrawn, HTLCError::AlreadyWithdrawn);
        require!(!htlc.refunded, HTLCError::AlreadyRefunded);
        require!(htlc.sender == ctx.accounts.sender.key(), HTLCError::InvalidSender);
        require!(clock.unix_timestamp >= htlc.timelock, HTLCError::TimelockNotExpired);

        htlc.refunded = true;

        // Transfer tokens back to sender
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.htlc_token_account.to_account_info(),
                to: ctx.accounts.sender_token_account.to_account_info(),
                authority: ctx.accounts.htlc_account.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, htlc.amount)?;

        emit!(HTLCRefunded {
            htlc: htlc.key(),
            sender: htlc.sender,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + HTLCAccount::INIT_SPACE,
        seeds = [b"htlc"],
        bump
    )]
    pub htlc_account: Account<'info, HTLCAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateHTLC<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + HTLC::INIT_SPACE,
        seeds = [b"htlc", hashlock.as_ref()],
        bump
    )]
    pub htlc: Account<'info, HTLC>,
    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = htlc_account,
        seeds = [b"htlc_token", htlc.key().as_ref()],
        bump
    )]
    pub htlc_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"htlc"],
        bump = htlc_account.bump,
        has_one = authority @ HTLCError::InvalidAuthority,
    )]
    pub htlc_account: Account<'info, HTLCAccount>,
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: This is the recipient of the HTLC
    pub recipient: UncheckedAccount<'info>,
    pub mint: Account<'info, token::Mint>,
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key(),
        constraint = sender_token_account.mint == mint.key(),
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(
        constraint = recipient_token_account.owner == recipient.key(),
        constraint = recipient_token_account.mint == mint.key(),
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RedeemHTLC<'info> {
    #[account(
        mut,
        seeds = [b"htlc", htlc.hashlock.as_ref()],
        bump,
        constraint = !htlc.withdrawn @ HTLCError::AlreadyWithdrawn,
        constraint = !htlc.refunded @ HTLCError::AlreadyRefunded,
    )]
    pub htlc: Account<'info, HTLC>,
    #[account(
        mut,
        seeds = [b"htlc_token", htlc.key().as_ref()],
        bump,
        constraint = htlc_token_account.amount >= htlc.amount,
    )]
    pub htlc_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"htlc"],
        bump = htlc_account.bump,
        has_one = authority @ HTLCError::InvalidAuthority,
    )]
    pub htlc_account: Account<'info, HTLCAccount>,
    pub recipient: Signer<'info>,
    #[account(
        mut,
        constraint = recipient_token_account.owner == recipient.key(),
        constraint = recipient_token_account.mint == htlc_token_account.mint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundHTLC<'info> {
    #[account(
        mut,
        seeds = [b"htlc", htlc.hashlock.as_ref()],
        bump,
        constraint = !htlc.withdrawn @ HTLCError::AlreadyWithdrawn,
        constraint = !htlc.refunded @ HTLCError::AlreadyRefunded,
    )]
    pub htlc: Account<'info, HTLC>,
    #[account(
        mut,
        seeds = [b"htlc_token", htlc.key().as_ref()],
        bump,
        constraint = htlc_token_account.amount >= htlc.amount,
    )]
    pub htlc_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"htlc"],
        bump = htlc_account.bump,
        has_one = authority @ HTLCError::InvalidAuthority,
    )]
    pub htlc_account: Account<'info, HTLCAccount>,
    pub sender: Signer<'info>,
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key(),
        constraint = sender_token_account.mint == htlc_token_account.mint,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct HTLCAccount {
    pub authority: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct HTLC {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub hashlock: [u8; 32],
    pub timelock: i64,
    pub amount: u64,
    pub withdrawn: bool,
    pub refunded: bool,
    pub preimage: Option<[u8; 32]>,
    pub created_at: i64,
}

#[event]
pub struct HTLCCreated {
    pub htlc: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub hashlock: [u8; 32],
    pub timelock: i64,
    pub amount: u64,
}

#[event]
pub struct HTLCRedeemed {
    pub htlc: Pubkey,
    pub preimage: [u8; 32],
    pub recipient: Pubkey,
}

#[event]
pub struct HTLCRefunded {
    pub htlc: Pubkey,
    pub sender: Pubkey,
}

#[error_code]
pub enum HTLCError {
    #[msg("Invalid timelock")]
    InvalidTimelock,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Already withdrawn")]
    AlreadyWithdrawn,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Invalid recipient")]
    InvalidRecipient,
    #[msg("Invalid sender")]
    InvalidSender,
    #[msg("Invalid preimage")]
    InvalidPreimage,
    #[msg("Timelock not expired")]
    TimelockNotExpired,
    #[msg("Invalid authority")]
    InvalidAuthority,
} 