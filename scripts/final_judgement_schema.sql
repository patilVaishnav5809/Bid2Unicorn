-- Final Judgement schema for Bid2Unicorn
-- Run in Supabase SQL Editor before using the Final Judgement page.

create extension if not exists pgcrypto;

create table if not exists judging_settings (
  id uuid primary key default gen_random_uuid(),
  required_judges int not null default 3,
  deadline_at timestamptz,
  is_finalized boolean not null default false,
  winner_team_id uuid references teams(id),
  finalized_at timestamptz,
  finalized_by text,
  created_at timestamptz not null default now()
);

insert into judging_settings (required_judges)
select 3
where not exists (select 1 from judging_settings);

create table if not exists news_events (
  id uuid primary key default gen_random_uuid(),
  source_news_id uuid references breaking_news(id) on delete set null,
  title text not null,
  announced_at timestamptz not null default now(),
  impact_weight int not null check (impact_weight between 1 and 5)
);

create table if not exists powercard_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  card_type text not null,
  used_at timestamptz not null default now(),
  impact_weight int not null check (impact_weight between 1 and 5)
);

create table if not exists team_news_judgements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  news_event_id uuid not null references news_events(id) on delete cascade,
  judge_id text not null,
  relevance_detection int not null check (relevance_detection between 0 and 8),
  speed_response int not null check (speed_response between 0 and 8),
  decision_quality int not null check (decision_quality between 0 and 8),
  outcome_realization int not null check (outcome_realization between 0 and 6),
  comment text,
  unique (team_id, news_event_id, judge_id)
);

create table if not exists team_powercard_judgements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  powercard_event_id uuid not null references powercard_events(id) on delete cascade,
  judge_id text not null,
  timing_precision int not null check (timing_precision between 0 and 10),
  context_fit int not null check (context_fit between 0 and 8),
  impact_value int not null check (impact_value between 0 and 8),
  resource_efficiency int not null check (resource_efficiency between 0 and 4),
  comment text,
  unique (team_id, powercard_event_id, judge_id)
);

create table if not exists team_final_judgements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  judge_id text not null,
  strategy_core int not null check (strategy_core between 0 and 20),
  execution_discipline int not null check (execution_discipline between 0 and 10),
  efficiency int not null check (efficiency between 0 and 10),
  comment text,
  unique (team_id, judge_id)
);

drop view if exists final_judgement_scores cascade;
create or replace view final_judgement_scores as
with news_avg as (
  select
    tnj.team_id,
    avg(relevance_detection + speed_response + decision_quality + outcome_realization)::numeric(10,2) as news_score_30,
    avg(case when ne.impact_weight >= 4
      then (relevance_detection + speed_response + decision_quality + outcome_realization) end)::numeric(10,2) as news_hi_impact
  from team_news_judgements tnj
  join news_events ne on ne.id = tnj.news_event_id
  group by tnj.team_id
),
power_avg as (
  select
    tpj.team_id,
    avg(timing_precision + context_fit + impact_value + resource_efficiency)::numeric(10,2) as power_score_30,
    avg(case when pe.impact_weight >= 4
      then (timing_precision + context_fit + impact_value + resource_efficiency) end)::numeric(10,2) as power_hi_impact
  from team_powercard_judgements tpj
  join powercard_events pe on pe.id = tpj.powercard_event_id
  group by tpj.team_id
),
core_avg as (
  select
    tfj.team_id,
    avg(strategy_core)::numeric(10,2) as strategy_core_20,
    avg(execution_discipline)::numeric(10,2) as execution_10,
    avg(efficiency)::numeric(10,2) as efficiency_10,
    count(distinct judge_id) as judge_count
  from team_final_judgements tfj
  group by tfj.team_id
),
portfolio as (
  select
    t.id as team_id,
    coalesce(sum(coalesce(s.current_price, s.base_price, 0)), 0) as portfolio_value,
    coalesce(t.spent, 0) as spent
  from teams t
  left join startups s on s.winning_team_id = t.id::text
  group by t.id, t.spent
)
select
  t.id as team_id,
  t.name as team_name,
  coalesce(c.strategy_core_20, 0) as strategy_core_20,
  coalesce(n.news_score_30, 0) as news_score_30,
  coalesce(pw.power_score_30, 0) as power_score_30,
  coalesce(c.execution_10, 0) as execution_10,
  coalesce(c.efficiency_10, 0) as efficiency_10,
  (coalesce(c.strategy_core_20, 0) + coalesce(n.news_score_30, 0) + coalesce(pw.power_score_30, 0) + coalesce(c.execution_10, 0) + coalesce(c.efficiency_10, 0))::numeric(10,2) as final_score,
  (coalesce(n.news_score_30, 0) + coalesce(pw.power_score_30, 0))::numeric(10,2) as tie_news_power,
  (coalesce(n.news_hi_impact, 0) + coalesce(pw.power_hi_impact, 0))::numeric(10,2) as tie_hi_impact_accuracy,
  ((portfolio.portfolio_value - portfolio.spent)::numeric / nullif(greatest(portfolio.spent, 1), 0))::numeric(10,4) as tie_risk_adjusted_return,
  coalesce(c.judge_count, 0) as judge_count
from teams t
left join core_avg c on c.team_id = t.id
left join news_avg n on n.team_id = t.id
left join power_avg pw on pw.team_id = t.id
left join portfolio on portfolio.team_id = t.id;
