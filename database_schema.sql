create table public.social_posts (
  id uuid not null default gen_random_uuid (),
  integration_id uuid null,
  platform text not null,
  content_text text not null,
  image_url text null,
  scheduled_time timestamp with time zone not null,
  published_at timestamp with time zone null,
  status text not null default 'scheduled'::text,
  external_id text null,
  external_url text null,
  is_thread boolean null default false,
  tracking_active boolean null default true,
  error_log text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  project_slug text null,
  post_info text null,
  last_metrics_pulled_at timestamp with time zone null,
  constraint social_posts_pkey primary key (id),
  constraint social_posts_integration_id_fkey foreign KEY (integration_id) references platform_integrations (id) on delete set null,
  constraint social_posts_platform_check check (
    (
      platform = any (
        array[
          'x'::text,
          'telegram'::text,
          'farcaster'::text,
          'binance_square'::text
        ]
      )
    )
  ),
  constraint social_posts_status_check check (
    (
      status = any (
        array[
          'scheduled'::text,
          'publishing'::text,
          'published'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_social_posts_tracking on public.social_posts using btree (platform, status, tracking_active, published_at) TABLESPACE pg_default;
create table public.scheduled_posts (
  id uuid not null default gen_random_uuid (),
  project_slug text null,
  content_text text not null,
  media_url text null,
  platforms text[] not null,
  scheduled_at timestamp with time zone not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  published_at timestamp with time zone null,
  constraint scheduled_posts_pkey primary key (id)
) TABLESPACE pg_default;
create table public.project_threads (
  project_slug text not null,
  latest_telegram_message_id bigint not null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint project_threads_pkey primary key (project_slug)
) TABLESPACE pg_default;
create table public.post_metrics_history (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  platform text not null,
  views integer null default 0,
  likes integer null default 0,
  reposts integer null default 0,
  comments integer null default 0,
  shares integer null default 0,
  recorded_at timestamp with time zone null default now(),
  constraint post_metrics_history_pkey primary key (id),
  constraint post_metrics_history_post_id_fkey foreign KEY (post_id) references social_posts (id) on delete CASCADE,
  constraint post_metrics_history_platform_check check (
    (
      platform = any (
        array[
          'x'::text,
          'telegram'::text,
          'farcaster'::text,
          'binance_square'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_post_metrics_post_time on public.post_metrics_history using btree (post_id, recorded_at) TABLESPACE pg_default;
create table public.platform_integrations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  platform text not null,
  account_handle text not null,
  account_id text null,
  extra_config jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint platform_integrations_pkey primary key (id),
  constraint platform_integrations_platform_check check (
    (
      platform = any (
        array[
          'x'::text,
          'telegram'::text,
          'farcaster'::text,
          'binance_square'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
create table public.channel_metrics_history (
  id uuid not null default gen_random_uuid (),
  integration_id uuid null,
  platform text not null,
  followers integer null default 0,
  following integer null default 0,
  total_posts integer null default 0,
  profile_views integer null default 0,
  platform_specific_metrics jsonb null default '{}'::jsonb,
  recorded_at timestamp with time zone null default now(),
  constraint channel_metrics_history_pkey primary key (id),
  constraint channel_metrics_history_integration_id_fkey foreign KEY (integration_id) references platform_integrations (id) on delete CASCADE,
  constraint channel_metrics_history_platform_check check (
    (
      platform = any (
        array[
          'x'::text,
          'telegram'::text,
          'farcaster'::text,
          'binance_square'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_channel_metrics_recorded on public.channel_metrics_history using btree (platform, recorded_at) TABLESPACE pg_default;