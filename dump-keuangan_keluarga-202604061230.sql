--
-- PostgreSQL database dump
--

\restrict HSYaSlGHrsyBjUJg8wzAGRiRPMTOC7meYoAl5eam3T7CUkssCni16KrKAkz9lQY

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-06 12:30:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE keuangan_keluarga;
--
-- TOC entry 6056 (class 1262 OID 16388)
-- Name: keuangan_keluarga; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE keuangan_keluarga WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Indonesia.1252';


\unrestrict HSYaSlGHrsyBjUJg8wzAGRiRPMTOC7meYoAl5eam3T7CUkssCni16KrKAkz9lQY
\connect keuangan_keluarga
\restrict HSYaSlGHrsyBjUJg8wzAGRiRPMTOC7meYoAl5eam3T7CUkssCni16KrKAkz9lQY

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6057 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 6058 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 3 (class 3079 OID 16427)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 6059 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16438)
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    name text NOT NULL,
    type character varying(50) NOT NULL,
    value numeric(15,2) NOT NULL,
    description text,
    acquired_date timestamp with time zone,
    goal_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_id uuid
);


--
-- TOC entry 222 (class 1259 OID 16448)
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text
);


--
-- TOC entry 223 (class 1259 OID 16456)
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    author_id uuid NOT NULL,
    category_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    featured_image text,
    meta_description character varying(160),
    keywords text,
    views_count bigint DEFAULT 0,
    seo_score bigint DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    image_alt_text text
);


--
-- TOC entry 224 (class 1259 OID 16470)
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_categories (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    name text NOT NULL,
    percentage bigint NOT NULL,
    description text,
    icon text,
    color text,
    bg_color text,
    "order" bigint DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_id uuid,
    type text DEFAULT 'kebutuhan'::text,
    month bigint DEFAULT 0,
    year bigint DEFAULT 0
);


--
-- TOC entry 286 (class 1259 OID 25981)
-- Name: budget_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_plans (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    user_id uuid NOT NULL,
    year bigint NOT NULL,
    month bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 225 (class 1259 OID 16480)
-- Name: debt_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_payments (
    id uuid NOT NULL,
    debt_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    date date NOT NULL,
    description text,
    created_at timestamp with time zone,
    user_id uuid,
    CONSTRAINT debt_payments_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 226 (class 1259 OID 16491)
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    remaining_amount numeric(12,2) NOT NULL,
    due_date timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone,
    installment_interval_months bigint DEFAULT 0,
    installment_amount numeric(12,2) DEFAULT 0,
    penalty_amount numeric(12,2) DEFAULT 0,
    next_installment_due_date timestamp with time zone,
    last_penalty_applied_at timestamp with time zone,
    created_by uuid,
    CONSTRAINT debts_remaining_non_negative CHECK ((remaining_amount >= (0)::numeric)),
    CONSTRAINT debts_total_positive CHECK ((total_amount > (0)::numeric))
);


--
-- TOC entry 227 (class 1259 OID 16507)
-- Name: families; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.families (
    id uuid NOT NULL,
    name text NOT NULL,
    photo_url text,
    application_id uuid,
    subscription_plan text DEFAULT 'Standard'::text,
    status text DEFAULT 'trial'::text,
    trial_ends_at timestamp with time zone,
    subscription_ends_at timestamp with time zone,
    created_at timestamp with time zone,
    monthly_budget numeric(12,2) DEFAULT 0,
    is_blocked boolean DEFAULT false,
    blocked_at timestamp with time zone
);


--
-- TOC entry 228 (class 1259 OID 16518)
-- Name: family_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_applications (
    id uuid NOT NULL,
    family_name text NOT NULL,
    head_of_family text NOT NULL,
    email text NOT NULL,
    number_of_members bigint NOT NULL,
    selected_plan text DEFAULT 'Standard'::text NOT NULL,
    reason_to_join text,
    status text DEFAULT 'pending'::text,
    applicant_id uuid,
    created_at timestamp with time zone
);


--
-- TOC entry 229 (class 1259 OID 16531)
-- Name: family_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_challenges (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'suggested'::character varying,
    points bigint DEFAULT 0,
    metadata text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 230 (class 1259 OID 16542)
-- Name: family_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_invitations (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    invited_by uuid NOT NULL,
    created_at timestamp with time zone
);


--
-- TOC entry 231 (class 1259 OID 16553)
-- Name: family_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_members (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone,
    monthly_budget numeric(12,2) DEFAULT 0
);


--
-- TOC entry 232 (class 1259 OID 16562)
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(15,2) NOT NULL,
    current_balance numeric(15,2) DEFAULT 0,
    status character varying(50) DEFAULT 'active'::character varying,
    category text,
    emoji character varying(50),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_id uuid,
    priority character varying(20) DEFAULT 'medium'::character varying
);


--
-- TOC entry 233 (class 1259 OID 16573)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone
);


--
-- TOC entry 287 (class 1259 OID 25999)
-- Name: payment_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_channels (
    id uuid NOT NULL,
    code text NOT NULL,
    name text,
    "group" text,
    type text,
    fee_flat numeric,
    fee_percent numeric,
    is_active boolean DEFAULT true,
    fee_borne_by text DEFAULT 'customer'::text,
    custom_fee_merchant numeric DEFAULT 0,
    icon_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_manual boolean DEFAULT false,
    account_name text,
    account_number text,
    description text
);


--
-- TOC entry 234 (class 1259 OID 16584)
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid NOT NULL,
    reference text,
    merchant_ref text,
    family_id uuid NOT NULL,
    plan_id uuid,
    plan_name text,
    amount numeric,
    fee numeric,
    total_amount numeric,
    status text DEFAULT 'UNPAID'::text,
    payment_method text,
    payment_name text,
    pay_code text,
    qr_code_url text,
    checkout_url text,
    instructions text,
    expired_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    fee_merchant numeric,
    fee_customer numeric,
    proof_url text,
    admin_notes text,
    account_name text,
    account_number text
);


--
-- TOC entry 288 (class 1259 OID 26015)
-- Name: platform_budget_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_budget_transfers (
    id uuid NOT NULL,
    from_category text NOT NULL,
    to_category text NOT NULL,
    amount numeric NOT NULL,
    reason text,
    transfer_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    type text DEFAULT 'TAKEN'::text NOT NULL
);


--
-- TOC entry 260 (class 1259 OID 25393)
-- Name: platform_expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_expense_categories (
    id uuid NOT NULL,
    name text NOT NULL,
    percentage numeric NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    type text DEFAULT 'EXPENSE'::text
);


--
-- TOC entry 235 (class 1259 OID 16592)
-- Name: platform_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_expenses (
    id uuid NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text,
    expense_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT platform_expenses_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 236 (class 1259 OID 16602)
-- Name: savings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.savings (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    name text NOT NULL,
    budget_category_id uuid,
    category character varying(255) DEFAULT 'savings'::character varying,
    target_amount numeric(12,2) NOT NULL,
    current_balance numeric(12,2) DEFAULT 0,
    emoji character varying(50),
    due_date bigint DEFAULT 0,
    created_at timestamp with time zone,
    user_id uuid,
    target_user_id uuid,
    month bigint DEFAULT 0,
    year bigint DEFAULT 0,
    CONSTRAINT savings_target_positive CHECK ((target_amount > (0)::numeric))
);


--
-- TOC entry 237 (class 1259 OID 16615)
-- Name: sitemap_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sitemap_configs (
    id uuid NOT NULL,
    path text NOT NULL,
    is_private boolean DEFAULT false,
    allow_bots boolean DEFAULT true,
    priority numeric DEFAULT 0.5,
    change_freq text DEFAULT 'weekly'::text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- TOC entry 238 (class 1259 OID 16626)
-- Name: sub_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_plans (
    id uuid NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    max_members bigint DEFAULT 5 NOT NULL,
    duration_days bigint DEFAULT 30 NOT NULL,
    description text,
    features text
);


--
-- TOC entry 239 (class 1259 OID 16638)
-- Name: support_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_reports (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    family_id uuid,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'OPEN'::text,
    admin_reply text,
    replied_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 240 (class 1259 OID 16648)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 241 (class 1259 OID 16656)
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
)
PARTITION BY RANGE (date);


--
-- TOC entry 261 (class 1259 OID 25405)
-- Name: transactions_2024_01; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_01 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 262 (class 1259 OID 25428)
-- Name: transactions_2024_02; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_02 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 263 (class 1259 OID 25451)
-- Name: transactions_2024_03; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_03 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 264 (class 1259 OID 25474)
-- Name: transactions_2024_04; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_04 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 265 (class 1259 OID 25497)
-- Name: transactions_2024_05; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_05 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 266 (class 1259 OID 25520)
-- Name: transactions_2024_06; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_06 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 267 (class 1259 OID 25543)
-- Name: transactions_2024_07; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_07 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 268 (class 1259 OID 25566)
-- Name: transactions_2024_08; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_08 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 269 (class 1259 OID 25589)
-- Name: transactions_2024_09; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_09 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 270 (class 1259 OID 25612)
-- Name: transactions_2024_10; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_10 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 271 (class 1259 OID 25635)
-- Name: transactions_2024_11; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_11 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 272 (class 1259 OID 25658)
-- Name: transactions_2024_12; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2024_12 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 273 (class 1259 OID 25681)
-- Name: transactions_2025_01; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_01 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 274 (class 1259 OID 25704)
-- Name: transactions_2025_02; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_02 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 275 (class 1259 OID 25727)
-- Name: transactions_2025_03; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_03 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 276 (class 1259 OID 25750)
-- Name: transactions_2025_04; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_04 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 277 (class 1259 OID 25773)
-- Name: transactions_2025_05; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_05 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 278 (class 1259 OID 25796)
-- Name: transactions_2025_06; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_06 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 279 (class 1259 OID 25819)
-- Name: transactions_2025_07; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_07 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 280 (class 1259 OID 25842)
-- Name: transactions_2025_08; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_08 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 281 (class 1259 OID 25865)
-- Name: transactions_2025_09; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_09 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 282 (class 1259 OID 25888)
-- Name: transactions_2025_10; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_10 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 283 (class 1259 OID 25911)
-- Name: transactions_2025_11; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_11 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 284 (class 1259 OID 25934)
-- Name: transactions_2025_12; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2025_12 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 242 (class 1259 OID 16669)
-- Name: transactions_2026_01; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_01 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 243 (class 1259 OID 16684)
-- Name: transactions_2026_02; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_02 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 244 (class 1259 OID 16699)
-- Name: transactions_2026_03; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_03 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 245 (class 1259 OID 16714)
-- Name: transactions_2026_04; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_04 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 246 (class 1259 OID 16729)
-- Name: transactions_2026_05; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_05 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 247 (class 1259 OID 16744)
-- Name: transactions_2026_06; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_06 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 248 (class 1259 OID 16759)
-- Name: transactions_2026_07; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_07 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 249 (class 1259 OID 16774)
-- Name: transactions_2026_08; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_08 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 250 (class 1259 OID 16789)
-- Name: transactions_2026_09; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_09 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 251 (class 1259 OID 16804)
-- Name: transactions_2026_10; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_10 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 252 (class 1259 OID 16819)
-- Name: transactions_2026_11; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_11 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 253 (class 1259 OID 16834)
-- Name: transactions_2026_12; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2026_12 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 254 (class 1259 OID 16849)
-- Name: transactions_2027_01; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2027_01 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 255 (class 1259 OID 16864)
-- Name: transactions_2027_02; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2027_02 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 256 (class 1259 OID 16879)
-- Name: transactions_2027_03; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2027_03 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 285 (class 1259 OID 25957)
-- Name: transactions_2027_04; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_2027_04 (
    id uuid CONSTRAINT transactions_id_not_null1 NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null1 NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null1 NOT NULL,
    to_wallet_id uuid,
    type text CONSTRAINT transactions_type_not_null1 NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null1 NOT NULL,
    fee numeric(12,2) DEFAULT 0 CONSTRAINT transactions_fee_not_null NOT NULL,
    category text,
    date timestamp with time zone CONSTRAINT transactions_date_not_null1 NOT NULL,
    description text,
    saving_id uuid,
    created_at timestamp with time zone,
    goal_id uuid,
    CONSTRAINT transactions_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- TOC entry 257 (class 1259 OID 16894)
-- Name: transactions_backup_20020; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_backup_20020 (
    id uuid CONSTRAINT transactions_id_not_null NOT NULL,
    family_id uuid CONSTRAINT transactions_family_id_not_null NOT NULL,
    user_id uuid CONSTRAINT transactions_user_id_not_null NOT NULL,
    wallet_id uuid CONSTRAINT transactions_wallet_id_not_null NOT NULL,
    to_wallet_id uuid,
    saving_id uuid,
    type text CONSTRAINT transactions_type_not_null NOT NULL,
    amount numeric(12,2) CONSTRAINT transactions_amount_not_null NOT NULL,
    fee numeric(12,2) DEFAULT 0,
    category text,
    date date CONSTRAINT transactions_date_not_null NOT NULL,
    description text,
    created_at timestamp with time zone
);


--
-- TOC entry 258 (class 1259 OID 16907)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    phone_number text,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    is_verified boolean DEFAULT false,
    verify_otp text,
    otp_expires_at timestamp with time zone,
    reset_token text,
    reset_expires timestamp with time zone,
    is_blocked boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 259 (class 1259 OID 16919)
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid NOT NULL,
    family_id uuid NOT NULL,
    name text NOT NULL,
    wallet_type text,
    account_number text,
    balance numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    CONSTRAINT wallets_name_not_empty CHECK ((name <> ''::text))
);


--
-- TOC entry 5187 (class 0 OID 0)
-- Name: transactions_2024_01; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_01 FOR VALUES FROM ('2024-01-01 00:00:00+07') TO ('2024-02-01 00:00:00+07');


--
-- TOC entry 5188 (class 0 OID 0)
-- Name: transactions_2024_02; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_02 FOR VALUES FROM ('2024-02-01 00:00:00+07') TO ('2024-03-01 00:00:00+07');


--
-- TOC entry 5189 (class 0 OID 0)
-- Name: transactions_2024_03; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_03 FOR VALUES FROM ('2024-03-01 00:00:00+07') TO ('2024-04-01 00:00:00+07');


--
-- TOC entry 5190 (class 0 OID 0)
-- Name: transactions_2024_04; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_04 FOR VALUES FROM ('2024-04-01 00:00:00+07') TO ('2024-05-01 00:00:00+07');


--
-- TOC entry 5191 (class 0 OID 0)
-- Name: transactions_2024_05; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_05 FOR VALUES FROM ('2024-05-01 00:00:00+07') TO ('2024-06-01 00:00:00+07');


--
-- TOC entry 5192 (class 0 OID 0)
-- Name: transactions_2024_06; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_06 FOR VALUES FROM ('2024-06-01 00:00:00+07') TO ('2024-07-01 00:00:00+07');


--
-- TOC entry 5193 (class 0 OID 0)
-- Name: transactions_2024_07; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_07 FOR VALUES FROM ('2024-07-01 00:00:00+07') TO ('2024-08-01 00:00:00+07');


--
-- TOC entry 5194 (class 0 OID 0)
-- Name: transactions_2024_08; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_08 FOR VALUES FROM ('2024-08-01 00:00:00+07') TO ('2024-09-01 00:00:00+07');


--
-- TOC entry 5195 (class 0 OID 0)
-- Name: transactions_2024_09; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_09 FOR VALUES FROM ('2024-09-01 00:00:00+07') TO ('2024-10-01 00:00:00+07');


--
-- TOC entry 5196 (class 0 OID 0)
-- Name: transactions_2024_10; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_10 FOR VALUES FROM ('2024-10-01 00:00:00+07') TO ('2024-11-01 00:00:00+07');


--
-- TOC entry 5197 (class 0 OID 0)
-- Name: transactions_2024_11; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_11 FOR VALUES FROM ('2024-11-01 00:00:00+07') TO ('2024-12-01 00:00:00+07');


--
-- TOC entry 5198 (class 0 OID 0)
-- Name: transactions_2024_12; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2024_12 FOR VALUES FROM ('2024-12-01 00:00:00+07') TO ('2025-01-01 00:00:00+07');


--
-- TOC entry 5199 (class 0 OID 0)
-- Name: transactions_2025_01; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_01 FOR VALUES FROM ('2025-01-01 00:00:00+07') TO ('2025-02-01 00:00:00+07');


--
-- TOC entry 5200 (class 0 OID 0)
-- Name: transactions_2025_02; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_02 FOR VALUES FROM ('2025-02-01 00:00:00+07') TO ('2025-03-01 00:00:00+07');


--
-- TOC entry 5201 (class 0 OID 0)
-- Name: transactions_2025_03; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_03 FOR VALUES FROM ('2025-03-01 00:00:00+07') TO ('2025-04-01 00:00:00+07');


--
-- TOC entry 5202 (class 0 OID 0)
-- Name: transactions_2025_04; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_04 FOR VALUES FROM ('2025-04-01 00:00:00+07') TO ('2025-05-01 00:00:00+07');


--
-- TOC entry 5203 (class 0 OID 0)
-- Name: transactions_2025_05; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_05 FOR VALUES FROM ('2025-05-01 00:00:00+07') TO ('2025-06-01 00:00:00+07');


--
-- TOC entry 5204 (class 0 OID 0)
-- Name: transactions_2025_06; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_06 FOR VALUES FROM ('2025-06-01 00:00:00+07') TO ('2025-07-01 00:00:00+07');


--
-- TOC entry 5205 (class 0 OID 0)
-- Name: transactions_2025_07; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_07 FOR VALUES FROM ('2025-07-01 00:00:00+07') TO ('2025-08-01 00:00:00+07');


--
-- TOC entry 5206 (class 0 OID 0)
-- Name: transactions_2025_08; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_08 FOR VALUES FROM ('2025-08-01 00:00:00+07') TO ('2025-09-01 00:00:00+07');


--
-- TOC entry 5207 (class 0 OID 0)
-- Name: transactions_2025_09; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_09 FOR VALUES FROM ('2025-09-01 00:00:00+07') TO ('2025-10-01 00:00:00+07');


--
-- TOC entry 5208 (class 0 OID 0)
-- Name: transactions_2025_10; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_10 FOR VALUES FROM ('2025-10-01 00:00:00+07') TO ('2025-11-01 00:00:00+07');


--
-- TOC entry 5209 (class 0 OID 0)
-- Name: transactions_2025_11; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_11 FOR VALUES FROM ('2025-11-01 00:00:00+07') TO ('2025-12-01 00:00:00+07');


--
-- TOC entry 5210 (class 0 OID 0)
-- Name: transactions_2025_12; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2025_12 FOR VALUES FROM ('2025-12-01 00:00:00+07') TO ('2026-01-01 00:00:00+07');


--
-- TOC entry 5172 (class 0 OID 0)
-- Name: transactions_2026_01; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_01 FOR VALUES FROM ('2026-01-01 00:00:00+07') TO ('2026-02-01 00:00:00+07');


--
-- TOC entry 5173 (class 0 OID 0)
-- Name: transactions_2026_02; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_02 FOR VALUES FROM ('2026-02-01 00:00:00+07') TO ('2026-03-01 00:00:00+07');


--
-- TOC entry 5174 (class 0 OID 0)
-- Name: transactions_2026_03; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_03 FOR VALUES FROM ('2026-03-01 00:00:00+07') TO ('2026-04-01 00:00:00+07');


--
-- TOC entry 5175 (class 0 OID 0)
-- Name: transactions_2026_04; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_04 FOR VALUES FROM ('2026-04-01 00:00:00+07') TO ('2026-05-01 00:00:00+07');


--
-- TOC entry 5176 (class 0 OID 0)
-- Name: transactions_2026_05; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_05 FOR VALUES FROM ('2026-05-01 00:00:00+07') TO ('2026-06-01 00:00:00+07');


--
-- TOC entry 5177 (class 0 OID 0)
-- Name: transactions_2026_06; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_06 FOR VALUES FROM ('2026-06-01 00:00:00+07') TO ('2026-07-01 00:00:00+07');


--
-- TOC entry 5178 (class 0 OID 0)
-- Name: transactions_2026_07; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_07 FOR VALUES FROM ('2026-07-01 00:00:00+07') TO ('2026-08-01 00:00:00+07');


--
-- TOC entry 5179 (class 0 OID 0)
-- Name: transactions_2026_08; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_08 FOR VALUES FROM ('2026-08-01 00:00:00+07') TO ('2026-09-01 00:00:00+07');


--
-- TOC entry 5180 (class 0 OID 0)
-- Name: transactions_2026_09; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_09 FOR VALUES FROM ('2026-09-01 00:00:00+07') TO ('2026-10-01 00:00:00+07');


--
-- TOC entry 5181 (class 0 OID 0)
-- Name: transactions_2026_10; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_10 FOR VALUES FROM ('2026-10-01 00:00:00+07') TO ('2026-11-01 00:00:00+07');


--
-- TOC entry 5182 (class 0 OID 0)
-- Name: transactions_2026_11; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_11 FOR VALUES FROM ('2026-11-01 00:00:00+07') TO ('2026-12-01 00:00:00+07');


--
-- TOC entry 5183 (class 0 OID 0)
-- Name: transactions_2026_12; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2026_12 FOR VALUES FROM ('2026-12-01 00:00:00+07') TO ('2027-01-01 00:00:00+07');


--
-- TOC entry 5184 (class 0 OID 0)
-- Name: transactions_2027_01; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2027_01 FOR VALUES FROM ('2027-01-01 00:00:00+07') TO ('2027-02-01 00:00:00+07');


--
-- TOC entry 5185 (class 0 OID 0)
-- Name: transactions_2027_02; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2027_02 FOR VALUES FROM ('2027-02-01 00:00:00+07') TO ('2027-03-01 00:00:00+07');


--
-- TOC entry 5186 (class 0 OID 0)
-- Name: transactions_2027_03; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2027_03 FOR VALUES FROM ('2027-03-01 00:00:00+07') TO ('2027-04-01 00:00:00+07');


--
-- TOC entry 5211 (class 0 OID 0)
-- Name: transactions_2027_04; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ATTACH PARTITION public.transactions_2027_04 FOR VALUES FROM ('2027-04-01 00:00:00+07') TO ('2027-05-01 00:00:00+07');


--
-- TOC entry 5984 (class 0 OID 16438)
-- Dependencies: 221
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5985 (class 0 OID 16448)
-- Dependencies: 222
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.blog_categories VALUES ('78c8f00c-ef24-4f47-be06-ebf57da44bd3', 'Tips Keuangan', 'tips-keuangan', 'Tips dan trik mengelola keuangan keluarga');
INSERT INTO public.blog_categories VALUES ('007047d5-b203-4632-824d-e8fc542bec6b', 'Investasi', 'investasi', 'Panduan investasi cerdas untuk masa depan');
INSERT INTO public.blog_categories VALUES ('fe91ee73-d0bc-4047-9a9d-827be6cb05c7', 'Gaya Hidup', 'gaya-hidup', 'Keseimbangan antara gaya hidup dan finansial');
INSERT INTO public.blog_categories VALUES ('7343c61a-39e0-4c80-afdd-c594db3fd8c0', 'Berita', 'berita', 'Berita terbaru seputar ekonomi dan finansial');
INSERT INTO public.blog_categories VALUES ('ee9dab77-826c-4954-af63-484261ce0bcb', 'Edukasi', 'edukasi', 'Materi edukasi finansial untuk keluarga');


--
-- TOC entry 5986 (class 0 OID 16456)
-- Dependencies: 223
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.blog_posts VALUES ('d8a43c61-2739-4b85-809b-b16b578f7798', 'p', 'p', 'p', '0c333f02-f095-4a47-9dd1-d6a15fcca928', '007047d5-b203-4632-824d-e8fc542bec6b', 'published', '/uploads/blog/blog_1773510988722846800.webp', '', '', 15, 0, '2026-03-15 00:56:35.312149+07', '2026-03-21 03:14:40.810108+07', NULL);
INSERT INTO public.blog_posts VALUES ('c579426a-9c8b-428e-9bd1-418b0bd3b664', 'website keuangan keluarga kamu', 'website-keuangan-keluarga-kamu', '
[pada](http://localhost:5173/writing-room/articles)

[p](http://localhost:5173/writing-room/articles)

# pasdadasdadadasdasdd

##  HALLOOO PARA GAMMERS DAN PARA ORANGTUA
###  HALLOOO PARA GAMMERS DAN PARA ORANGTUAasdasdasdasdasdads







# ', '0c333f02-f095-4a47-9dd1-d6a15fcca928', '78c8f00c-ef24-4f47-be06-ebf57da44bd3', 'published', '/uploads/blog/blog_1774033127770191200.webp', 'website keuangan keluarga kamu', 'website keuangan keluarga kamu', 69, 62, '2026-03-21 02:03:55.180626+07', '2026-03-24 23:44:39.921199+07', '');
INSERT INTO public.blog_posts VALUES ('8f51a8fe-569d-4322-94c2-34f472726be7', 'test', 'test', '# papsdpadjad
## asdadadsads

### askdajdauwheaudh a
asdasdadawdasdasdasdadasdasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
', '0c333f02-f095-4a47-9dd1-d6a15fcca928', 'ee9dab77-826c-4954-af63-484261ce0bcb', 'published', '/uploads/blog/blog_1774675856290393200.webp', 'test', 'test', 12, 50, '2026-03-26 04:40:25.708937+07', '2026-03-30 12:19:24.184967+07', '');


--
-- TOC entry 5987 (class 0 OID 16470)
-- Dependencies: 224
-- Data for Name: budget_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.budget_categories VALUES ('823a5bf4-505e-4e9d-ab8d-c732f291aa79', '00000000-0000-0000-0000-000000000000', 'AW', 0, 'p', 'ShoppingCart', 'text-blue-500', '', 6, '0001-01-01 06:42:04+06:42:04', '2026-03-14 01:37:20.073568+07', NULL, 'kebutuhan', 0, 0);
INSERT INTO public.budget_categories VALUES ('a3a0ff18-31e0-457f-90e6-f424ee531985', '00000000-0000-0000-0000-000000000000', 'p', 0, 'p', 'ShoppingCart', 'text-blue-500', '', 6, '0001-01-01 06:42:04+06:42:04', '2026-03-14 01:57:21.112956+07', NULL, 'kebutuhan', 0, 0);
INSERT INTO public.budget_categories VALUES ('2a6cf1e0-5e35-4d3b-b9a9-839cf52b4357', '00000000-0000-0000-0000-000000000000', 'o', 0, '', 'ShoppingCart', 'text-blue-500', '', 6, '0001-01-01 06:42:04+06:42:04', '2026-03-14 01:57:57.738978+07', NULL, 'kebutuhan', 0, 0);
INSERT INTO public.budget_categories VALUES ('a3d0350a-1bc4-4c88-a7f8-35d71cf9fe5d', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Hiburan', 10, 'Kategori Hiburan', 'Coins', 'text-pink-500', 'bg-pink-50', 4, '2026-03-30 12:10:12.682864+07', '2026-03-30 12:10:12.682864+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'keinginan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('6e87b4d4-0031-484f-becb-80cd940cf938', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Belanja', 15, 'Kategori Belanja', 'ShoppingCart', 'text-emerald-500', 'bg-emerald-50', 5, '2026-03-30 12:10:12.690137+07', '2026-03-30 12:10:12.690137+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'keinginan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('595dfd0c-5759-4caa-b0dc-ef74066af2e4', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Kesehatan', 15, 'Kategori Kesehatan', 'ShieldCheck', 'text-red-500', 'bg-red-50', 6, '2026-03-30 12:10:12.694659+07', '2026-03-30 12:10:12.694659+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('38b4f61e-d587-4df6-a736-d59ae32e8eee', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Pendidikan', 10, 'Kategori Pendidikan', 'Coins', 'text-indigo-500', 'bg-indigo-50', 7, '2026-03-30 12:10:12.698394+07', '2026-03-30 12:10:12.698394+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('f1dbb29d-515c-4f59-885a-9f9f1bbf2d7e', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Makanan', 20, 'Kategori Makanan', 'Coffee', 'text-orange-500', 'bg-orange-50', 1, '2026-03-30 11:51:04.684791+07', '2026-03-30 12:02:59.690032+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('03143cf2-9e48-46b6-964c-1a3e9f4bf6b5', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Transport', 15, 'Kategori Transport', 'Wallet', 'text-blue-500', 'bg-blue-50', 2, '2026-03-30 11:51:04.693145+07', '2026-03-30 12:02:59.694426+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('01edce4a-37d0-48e4-ac6f-b8c02e6bdad1', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Tagihan', 15, 'Kategori Tagihan', 'ShieldCheck', 'text-purple-500', 'bg-purple-50', 3, '2026-03-30 11:51:04.700947+07', '2026-03-30 12:02:59.698596+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('8e7e6643-82a1-440a-8bb6-eeec47339b96', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Hiburan', 10, 'Kategori Hiburan', 'Coins', 'text-pink-500', 'bg-pink-50', 4, '2026-03-30 11:51:04.710185+07', '2026-03-30 12:02:59.703703+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'keinginan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('9beeeb6b-b29d-4e6c-bf00-757d57eccbd1', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Belanja', 15, 'Kategori Belanja', 'ShoppingCart', 'text-emerald-500', 'bg-emerald-50', 5, '2026-03-30 11:51:04.717195+07', '2026-03-30 12:02:59.70799+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'keinginan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('06563caa-259d-4417-bc0e-7649d571730e', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Kesehatan', 15, 'Kategori Kesehatan', 'ShieldCheck', 'text-red-500', 'bg-red-50', 6, '2026-03-30 11:51:04.726125+07', '2026-03-30 12:02:59.712994+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('10d33147-6750-4765-80cf-b94d6dd4fe62', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Pendidikan', 10, 'Kategori Pendidikan', 'Coins', 'text-indigo-500', 'bg-indigo-50', 7, '2026-03-30 11:51:04.730868+07', '2026-03-30 12:02:59.716228+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('3a793baf-84e4-4c04-9dca-bc695ed3268e', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Makanan', 20, 'Kategori Makanan', 'Coffee', 'text-orange-500', 'bg-orange-50', 1, '2026-03-30 12:10:12.635379+07', '2026-03-30 12:10:12.635379+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('f50a22a1-cef7-4d9a-8bd4-b2b5e9413766', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Transport', 15, 'Kategori Transport', 'Wallet', 'text-blue-500', 'bg-blue-50', 2, '2026-03-30 12:10:12.671311+07', '2026-03-30 12:10:12.671311+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'kebutuhan', 3, 2026);
INSERT INTO public.budget_categories VALUES ('22884f29-b15c-44f9-aceb-88e46b3676cd', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Tagihan', 15, 'Kategori Tagihan', 'ShieldCheck', 'text-purple-500', 'bg-purple-50', 3, '2026-03-30 12:10:12.676009+07', '2026-03-30 12:10:12.676009+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'kebutuhan', 3, 2026);


--
-- TOC entry 6048 (class 0 OID 25981)
-- Dependencies: 286
-- Data for Name: budget_plans; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.budget_plans VALUES ('a38caf0b-e7bf-40a6-b792-b59ab851f64f', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', 2026, 1, 1000000.00, '2026-03-28 10:09:46.621968+07', '2026-03-28 10:09:46.621968+07');
INSERT INTO public.budget_plans VALUES ('0189ad3c-652f-4ff0-a1f9-c1b2f7b386ee', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', 2026, 3, 10000000.00, '2026-03-28 11:35:04.117958+07', '2026-03-28 11:55:56.442306+07');
INSERT INTO public.budget_plans VALUES ('77bcbed3-2ff3-422b-9a11-d60eed13736d', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', 2026, 2, 1000000.00, '2026-03-28 11:59:08.360572+07', '2026-03-28 11:59:08.360572+07');
INSERT INTO public.budget_plans VALUES ('7ad64e3e-fca2-41ec-b4d1-d9fbbd8cad18', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 2026, 3, 10000000.00, '2026-03-30 10:37:16.954087+07', '2026-03-30 10:37:16.954087+07');


--
-- TOC entry 5988 (class 0 OID 16480)
-- Dependencies: 225
-- Data for Name: debt_payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.debt_payments VALUES ('170d06a7-4ffd-46b4-875a-058315dc4af5', 'a2e7e0a9-8634-4e9a-b42d-4248dbe6bebe', '3c4b9867-6921-4fa1-9e7b-c2ae38f14a1c', 10000.00, '2026-03-25', '', '2026-03-25 22:18:52.616616+07', NULL);
INSERT INTO public.debt_payments VALUES ('51249f5a-eeea-4554-94bf-11814a723569', '7c9d3e02-dead-451f-9ea4-5a1a56d92cbe', '1a34939a-ca0b-4b80-8361-7dcdb2333006', 10000.00, '2026-03-30', '', '2026-03-30 12:23:58.661899+07', '3f032940-9551-4955-b7f7-591902e94eb1');
INSERT INTO public.debt_payments VALUES ('85d6d301-9e30-49ec-837c-7b396f9f9ad1', '7c9d3e02-dead-451f-9ea4-5a1a56d92cbe', '96a8e49e-95c2-4222-870f-4cd3fdb022dd', 90000.00, '2026-03-30', 'Cicilan p - Maret 2026', '2026-03-30 18:16:05.531244+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3');


--
-- TOC entry 5989 (class 0 OID 16491)
-- Dependencies: 226
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.debts VALUES ('a5d4461f-bb5a-4b2c-bf76-b8f17a4389e3', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'p', '', 1000000.00, 0.00, 1000000.00, '2026-03-31 07:00:00+07', 'active', '2026-03-30 10:40:05.596349+07', 3, 100000.00, 1000.00, '2026-03-31 07:00:00+07', '0001-01-01 06:42:04+06:42:04', '3f032940-9551-4955-b7f7-591902e94eb1');
INSERT INTO public.debts VALUES ('7c9d3e02-dead-451f-9ea4-5a1a56d92cbe', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'p', '', 1000000.00, 100000.00, 900000.00, '2026-03-31 07:00:00+07', 'active', '2026-03-30 10:40:56.339739+07', 1, 100000.00, 10000.00, '2026-05-01 07:00:00+07', '0001-01-01 06:42:04+06:42:04', '67e17319-6ef7-43f0-841d-ce3531c0e0b3');


--
-- TOC entry 5990 (class 0 OID 16507)
-- Dependencies: 227
-- Data for Name: families; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.families VALUES ('e110c7d0-a45a-49be-b2a0-406c877a22ad', 'budiono siregar', '', NULL, 'Premium', 'active', '2026-04-03 11:02:31.18891+07', '2033-04-20 15:12:14.534615+07', '2026-03-27 11:02:31.18891+07', 0.00, false, NULL);


--
-- TOC entry 5991 (class 0 OID 16518)
-- Dependencies: 228
-- Data for Name: family_applications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5992 (class 0 OID 16531)
-- Dependencies: 229
-- Data for Name: family_challenges; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5993 (class 0 OID 16542)
-- Dependencies: 230
-- Data for Name: family_invitations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5994 (class 0 OID 16553)
-- Dependencies: 231
-- Data for Name: family_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.family_members VALUES ('1d72f29e-6811-4622-8fae-66739aa371c8', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', 'head_of_family', '2026-03-27 11:02:31.190667+07', 10000000.00);
INSERT INTO public.family_members VALUES ('986f7747-d054-40db-ba5e-451c22542c4d', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'member', '2026-03-27 16:04:23.654649+07', 0.00);


--
-- TOC entry 5995 (class 0 OID 16562)
-- Dependencies: 232
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.goals VALUES ('2042890d-ffea-458f-88e1-be5ee39f3fb9', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'p', 100000.00, 0.00, 'active', '', '🎯', '2026-03-30 12:25:39.82105+07', '2026-03-30 12:25:39.82105+07', '3f032940-9551-4955-b7f7-591902e94eb1', 'medium');


--
-- TOC entry 5996 (class 0 OID 16573)
-- Dependencies: 233
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES ('548edbd9-a39e-4589-b070-581bd736fe74', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Standard'' Anda telah aktif hingga 27 Apr 2026. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 15:12:14.538297+07');
INSERT INTO public.notifications VALUES ('520204fc-6e3e-4b0e-be99-0e841af45d41', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Family'' Anda telah aktif hingga 27 May 2026. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 17:03:33.271096+07');
INSERT INTO public.notifications VALUES ('615943ea-507c-48e5-8b38-ebd5f617a2a4', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 22 May 2027. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 18:14:49.835621+07');
INSERT INTO public.notifications VALUES ('53d521bd-57b9-4395-b744-8c24a07da541', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 16 May 2028. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 18:22:06.082779+07');
INSERT INTO public.notifications VALUES ('886a95fa-f10f-4222-95ba-8f3df39e2a14', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 11 May 2029. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 18:26:14.308133+07');
INSERT INTO public.notifications VALUES ('171c1472-c412-42c7-b029-0c170165241f', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 06 May 2030. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 18:36:43.618044+07');
INSERT INTO public.notifications VALUES ('bf7ac996-0e1d-465b-8698-956a9e494871', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 01 May 2031. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 18:42:42.207971+07');
INSERT INTO public.notifications VALUES ('bb71a46c-f9af-4d04-9f9a-fc85ba56d0c2', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 25 Apr 2032. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-28 19:34:23.36977+07');
INSERT INTO public.notifications VALUES ('4ea3248f-1426-402a-991f-861e012ab165', '3f032940-9551-4955-b7f7-591902e94eb1', 'subscription', 'Pembayaran Berhasil!', 'Selamat! Paket ''Premium'' Anda telah aktif hingga 20 Apr 2033. Semua limit fitur Anda telah diperbarui secara otomatis.', false, '2026-03-30 10:15:57.785636+07');


--
-- TOC entry 6049 (class 0 OID 25999)
-- Dependencies: 287
-- Data for Name: payment_channels; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payment_channels VALUES ('16de7899-4f97-4911-a68a-86d94cfb881c', 'BNIVA', 'BNI Virtual Account', 'Virtual Account', 'direct', 4250, 0, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/n22Qsh8jMa1583433577.png', '2026-03-28 16:55:59.82775+07', '2026-03-30 10:02:02.936071+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('708f157a-e862-46fd-a595-924b9343f172', 'BRIVA', 'BRI Virtual Account', 'Virtual Account', 'direct', 4250, 0, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/8WQ3APST5s1579461828.png', '2026-03-28 16:55:59.830558+07', '2026-03-30 10:02:02.948797+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('eaa1eb6a-ee18-4fed-b6b3-f6f1a65f801b', 'MANDIRIVA', 'Mandiri Virtual Account', 'Virtual Account', 'direct', 4250, 0, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/T9Z012UE331583531536.png', '2026-03-28 16:55:59.831624+07', '2026-03-30 10:02:02.95089+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('930e2186-8f35-42d4-92ed-003a7686565e', 'BCAVA', 'BCA Virtual Account', 'Virtual Account', 'direct', 5500, 0, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/ytBKvaleGy1605201833.png', '2026-03-28 16:55:59.832654+07', '2026-03-30 10:02:02.952772+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('029e14ba-9515-4428-bd19-64e615234cea', 'MUAMALATVA', 'Muamalat Virtual Account', 'Virtual Account', 'direct', 4250, 0, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/GGwwcgdYaG1611929720.png', '2026-03-28 16:55:59.833235+07', '2026-03-30 10:02:02.955169+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('e60bbcd0-07eb-498c-b0b8-b3026b547356', 'QRIS2', 'QRIS', 'E-Wallet', 'direct', 750, 0.7, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/8ewGzP6SWe1649667701.png', '2026-03-28 16:55:59.833744+07', '2026-03-30 10:02:02.956585+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('097984aa-41db-409a-bde6-2834fc5ff960', 'DANA', 'DANA', 'E-Wallet', 'redirect', 0, 3, true, 'merchant', 0, 'https://assets.tripay.co.id/upload/payment-icon/sj3UHLu8Tu1655719621.png', '2026-03-28 16:55:59.834435+07', '2026-03-30 10:02:02.958596+07', false, '', '', '');
INSERT INTO public.payment_channels VALUES ('fc6702f0-aa5a-47e1-9643-f40dc1086320', 'SHOPEEPAY', 'ShopeePay', 'E-Wallet', 'redirect', 0, 3, true, 'customer', 0, 'https://assets.tripay.co.id/upload/payment-icon/d204uajhlS1655719774.png', '2026-03-28 16:55:59.834942+07', '2026-03-30 10:02:02.960137+07', false, '', '', '');


--
-- TOC entry 5997 (class 0 OID 16584)
-- Dependencies: 234
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payment_transactions VALUES ('547ac0b8-fea5-436b-8409-cc612dd6ea06', 'DEV-T49021357119AX489', 'INV-1774697821278083900', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 3000, 103000, 'PAID', 'DANA', 'DANA', '', '', 'https://tripay.co.id/checkout/DEV-T49021357119AX489', '[{"title":"Pembayaran via DANA","steps":["Klik tombol Lanjutkan Pembayaran","Anda akan dipindah ke Halaman Pembayaran DANA ","Pastikan saldo DANA anda cukup","Masukkan nomor handpone yang terdaftar pada akun DANA","Anda akan diminta untuk memasukkan PIN DANA Anda","Kemudian anda akan diminta untuk memasukkan kode OTP yang dikirim ke nomor DANA","Kemudian akan muncul detail tansaksi pastikan sudah sesuai dengan transaksi yang ingin anda bayar","Klik tombol \u003cb\u003ePAY\u003c/b\u003e","Transaksi selesai. Simpan bukti pembayaran Anda"]}]', '2026-03-28 19:36:01+07', '2026-03-28 18:42:42.189556+07', '2026-03-28 18:37:01.642797+07', '2026-03-28 18:42:42.189556+07', 3000, 0, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('8ff53f7c-f88e-472b-9e27-1e2edcb887ce', 'DEV-T490213571391HIDQ', 'INV-1774701223664795300', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 97000, 3000, 100000, 'PAID', 'DANA', 'DANA', '', '', 'https://tripay.co.id/checkout/DEV-T490213571391HIDQ', '[{"title":"Pembayaran via DANA","steps":["Klik tombol Lanjutkan Pembayaran","Anda akan dipindah ke Halaman Pembayaran DANA ","Pastikan saldo DANA anda cukup","Masukkan nomor handpone yang terdaftar pada akun DANA","Anda akan diminta untuk memasukkan PIN DANA Anda","Kemudian anda akan diminta untuk memasukkan kode OTP yang dikirim ke nomor DANA","Kemudian akan muncul detail tansaksi pastikan sudah sesuai dengan transaksi yang ingin anda bayar","Klik tombol \u003cb\u003ePAY\u003c/b\u003e","Transaksi selesai. Simpan bukti pembayaran Anda"]}]', '2026-03-28 20:32:43+07', '2026-03-28 19:34:23.353676+07', '2026-03-28 19:33:43.910177+07', '2026-03-28 19:34:23.353676+07', 3000, 0, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('feb383c2-c586-4019-8989-1b9b8e5ca33a', 'MB-1774840594746386400', 'MB-1774840594746386400', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 0, 100000, 'FAILED', 'test', 'test', 'MANUAL', '/uploads/payments/logo-test-1774840054.png', '', '[{"title": "Transfer Bank test", "steps": ["Silahkan transfer ke rekening 0723712313 a/n adt", "Upload bukti transfer di halaman invoice untuk verifikasi otomatis", ""]}]', '2026-03-31 10:16:34.746386+07', NULL, '2026-03-30 10:16:34.746386+07', '2026-03-30 10:16:59.699769+07', 0, 0, '/uploads/payments/proof-feb383c2-1774840608.jpg', '', 'adt', '0723712313');
INSERT INTO public.payment_transactions VALUES ('00b7597c-46bf-471e-92bf-ec3498a08292', 'MB-1774840640394845700', 'MB-1774840640394845700', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 0, 100000, 'FAILED', 'test', 'test', 'MANUAL', '/uploads/payments/logo-test-1774840054.png', '', '[{"title": "Transfer Bank test", "steps": ["Silahkan transfer ke rekening 0723712313 a/n adt", "Upload bukti transfer di halaman invoice untuk verifikasi otomatis", ""]}]', '2026-03-31 10:17:20.395128+07', NULL, '2026-03-30 10:17:20.395128+07', '2026-03-30 10:17:38.655008+07', 0, 0, '/uploads/payments/proof-00b7597c-1774840650.jpg', 'test', 'adt', '0723712313');
INSERT INTO public.payment_transactions VALUES ('23c22034-7b3b-4710-9a5f-986c6c4bbb52', 'DEV-T49021357062IZQAT', 'INV-1774685329047313500', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '5d3aa5f1-3608-4575-9a77-2932b3a934f5', 'Standard', 25000, 4250, 29250, 'PAID', 'BRIVA', 'BRI Virtual Account', '332992957860612', '', 'https://tripay.co.id/checkout/DEV-T49021357062IZQAT', '[{"title":"Internet Banking","steps":["Login ke internet banking Bank BRI Anda","Pilih menu \u003cb\u003ePembayaran\u003c/b\u003e lalu klik menu \u003cb\u003eBRIVA\u003c/b\u003e","Pilih rekening sumber dan masukkan Kode Bayar (\u003cb\u003e332992957860612\u003c/b\u003e) lalu klik \u003cb\u003eKirim\u003c/b\u003e","Detail transaksi akan ditampilkan, pastikan data sudah sesuai","Klik \u003cb\u003eLanjutkan\u003c/b\u003e","Masukkan kata sandi ibanking lalu klik \u003cb\u003eRequest\u003c/b\u003e untuk mengirim m-PIN ke nomor HP Anda","Periksa HP Anda dan masukkan m-PIN yang diterima lalu klik \u003cb\u003eKirim\u003c/b\u003e","Transaksi sukses, simpan bukti transaksi Anda"]},{"title":"Aplikasi BRImo","steps":["Login ke aplikasi BRImo Anda","Pilih menu \u003cb\u003eBRIVA\u003c/b\u003e","Pilih sumber dana dan masukkan Nomor Pembayaran (\u003cb\u003e332992957860612\u003c/b\u003e) lalu klik \u003cb\u003eLanjut\u003c/b\u003e","Klik \u003cb\u003eLanjut\u003c/b\u003e","Detail transaksi akan ditampilkan, pastikan data sudah sesuai","Klik \u003cb\u003eLanjutkan\u003c/b\u003e","Klik \u003cb\u003eKonfirmasi\u003c/b\u003e","Klik \u003cb\u003eLanjut\u003c/b\u003e","Masukkan kata sandi ibanking Anda","Klik \u003cb\u003eLanjut\u003c/b\u003e","Transaksi sukses, simpan bukti transaksi Anda"]},{"title":"ATM BRI","steps":["Lakukan pembayaran melalui ATM Bank BRI","Pilih menu \u003cb\u003eTransaksi Lain \u003e Pembayaran \u003e Lainnya \u003e Pilih BRIVA\u003c/b\u003e","Masukkan Nomor VA (\u003cb\u003e332992957860612\u003c/b\u003e)","Pilih \u003cb\u003eYa\u003c/b\u003e untuk memproses pembayaran"]}]', '2026-03-29 15:08:49+07', '2026-03-28 15:12:14.519856+07', '2026-03-28 15:08:49.361859+07', '2026-03-28 15:12:14.520261+07', 0, 4250, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('ad027331-ea88-4ec2-bde6-16626d5ae0a9', 'DEV-T49021357085FEOVL', 'INV-1774692142934102700', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '732f17c5-8699-4ff5-9ada-d7fa51307608', 'Family', 54250, 4250, 58500, 'PAID', 'BNIVA', 'BNI Virtual Account', '498257158591406', '', 'https://tripay.co.id/checkout/DEV-T49021357085FEOVL', '[{"title":"Wondr By BNI","steps":["Buka Aplikasi Wondr By BNI","Pilih menu \u003cb\u003eVirtual Account\u003c/b\u003e","Pilih \u003cb\u003eTujuan Baru\u003c/b\u003e","Masukkan Nomor \u003cb\u003eVirtual Account\u003c/b\u003e","Klik tombol \u003cb\u003eLanjut\u003c/b\u003e","Akan ditampikan detail transaksi, Pilih rekening sumber dana","Klik tombol \u003cb\u003eLanjut\u003c/b\u003e","Pastikan semua informasi sudah sesuai kemudian klik \u003cb\u003eTransaksi Sekarang\u003c/b\u003e","Masukan PIN Anda","Transaksi selesai, simpan bukti pembayaran Anda"]},{"title":"Internet Banking","steps":["Login ke internet banking Bank BNI Anda","Pilih menu \u003cb\u003eTransaksi\u003c/b\u003e lalu klik menu \u003cb\u003eVirtual Account Billing\u003c/b\u003e","Masukkan Nomor VA (\u003cb\u003e498257158591406\u003c/b\u003e) lalu pilih \u003cb\u003eRekening Debit\u003c/b\u003e","Detail transaksi akan ditampilkan, pastikan data sudah sesuai","Masukkan respon key BNI appli 2","Transaksi sukses, simpan bukti transaksi Anda"]},{"title":"ATM BNI","steps":["Masukkan kartu Anda","Pilih Bahasa","Masukkan PIN ATM Anda","Kemudian, pilih \u003cb\u003eMenu Lainnya\u003c/b\u003e","Pilih \u003cb\u003eTransfer\u003c/b\u003e dan pilih jenis rekening yang akan digunakan (Contoh: Dari rekening Tabungan)","Pilih \u003cb\u003eVirtual Account Billing\u003c/b\u003e. Masukkan Nomor VA (\u003cb\u003e498257158591406\u003c/b\u003e)","Tagihan yang harus dibayarkan akan muncul pada layar konfirmasi","Konfirmasi, apabila telah selesai, lanjutkan transaksi","Transaksi Anda telah selesai"]},{"title":"Mobile Banking BNI","steps":["Akses BNI Mobile Banking dari handphone kemudian masukkan \u003cb\u003eUser ID dan Password\u003c/b\u003e","Pilih menu \u003cb\u003eTransfer\u003c/b\u003e","Pilih menu \u003cb\u003eVirtual Account Billing\u003c/b\u003e kemudian pilih rekening debet","Masukkan Nomor \u003cb\u003eVirtual Account\u003c/b\u003e","Tagihan yang harus dibayarkan akan muncul pada layar konfirmasi","Konfirmasi transaksi dan masukkan Password Transaksi","Pembayaran Anda Telah Berhasil"]}]', '2026-03-29 17:01:23+07', '2026-03-28 17:03:33.26839+07', '2026-03-28 17:02:23.230757+07', '2026-03-28 17:03:33.26839+07', 0, 4250, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('13e933b7-4c31-4840-9120-8f3df2586ac9', 'DEV-T49021357110EQXL4', 'INV-1774696442113767200', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 104250, 4250, 108500, 'PAID', 'BNIVA', 'BNI Virtual Account', '884525187135409', '', 'https://tripay.co.id/checkout/DEV-T49021357110EQXL4', '[{"title":"Wondr By BNI","steps":["Buka Aplikasi Wondr By BNI","Pilih menu \u003cb\u003eVirtual Account\u003c/b\u003e","Pilih \u003cb\u003eTujuan Baru\u003c/b\u003e","Masukkan Nomor \u003cb\u003eVirtual Account\u003c/b\u003e","Klik tombol \u003cb\u003eLanjut\u003c/b\u003e","Akan ditampikan detail transaksi, Pilih rekening sumber dana","Klik tombol \u003cb\u003eLanjut\u003c/b\u003e","Pastikan semua informasi sudah sesuai kemudian klik \u003cb\u003eTransaksi Sekarang\u003c/b\u003e","Masukan PIN Anda","Transaksi selesai, simpan bukti pembayaran Anda"]},{"title":"Internet Banking","steps":["Login ke internet banking Bank BNI Anda","Pilih menu \u003cb\u003eTransaksi\u003c/b\u003e lalu klik menu \u003cb\u003eVirtual Account Billing\u003c/b\u003e","Masukkan Nomor VA (\u003cb\u003e884525187135409\u003c/b\u003e) lalu pilih \u003cb\u003eRekening Debit\u003c/b\u003e","Detail transaksi akan ditampilkan, pastikan data sudah sesuai","Masukkan respon key BNI appli 2","Transaksi sukses, simpan bukti transaksi Anda"]},{"title":"ATM BNI","steps":["Masukkan kartu Anda","Pilih Bahasa","Masukkan PIN ATM Anda","Kemudian, pilih \u003cb\u003eMenu Lainnya\u003c/b\u003e","Pilih \u003cb\u003eTransfer\u003c/b\u003e dan pilih jenis rekening yang akan digunakan (Contoh: Dari rekening Tabungan)","Pilih \u003cb\u003eVirtual Account Billing\u003c/b\u003e. Masukkan Nomor VA (\u003cb\u003e884525187135409\u003c/b\u003e)","Tagihan yang harus dibayarkan akan muncul pada layar konfirmasi","Konfirmasi, apabila telah selesai, lanjutkan transaksi","Transaksi Anda telah selesai"]},{"title":"Mobile Banking BNI","steps":["Akses BNI Mobile Banking dari handphone kemudian masukkan \u003cb\u003eUser ID dan Password\u003c/b\u003e","Pilih menu \u003cb\u003eTransfer\u003c/b\u003e","Pilih menu \u003cb\u003eVirtual Account Billing\u003c/b\u003e kemudian pilih rekening debet","Masukkan Nomor \u003cb\u003eVirtual Account\u003c/b\u003e","Tagihan yang harus dibayarkan akan muncul pada layar konfirmasi","Konfirmasi transaksi dan masukkan Password Transaksi","Pembayaran Anda Telah Berhasil"]}]', '2026-03-29 18:13:02+07', '2026-03-28 18:14:49.832627+07', '2026-03-28 18:14:02.319502+07', '2026-03-28 18:14:49.83313+07', 0, 4250, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('5241babb-9509-4391-8cb7-93791473c6bd', 'DEV-T49021357113GXNU5', 'INV-1774696506622569800', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 103093, 3093, 106186, 'PAID', 'DANA', 'DANA', '', '', 'https://tripay.co.id/checkout/DEV-T49021357113GXNU5', '[{"title":"Pembayaran via DANA","steps":["Klik tombol Lanjutkan Pembayaran","Anda akan dipindah ke Halaman Pembayaran DANA ","Pastikan saldo DANA anda cukup","Masukkan nomor handpone yang terdaftar pada akun DANA","Anda akan diminta untuk memasukkan PIN DANA Anda","Kemudian anda akan diminta untuk memasukkan kode OTP yang dikirim ke nomor DANA","Kemudian akan muncul detail tansaksi pastikan sudah sesuai dengan transaksi yang ingin anda bayar","Klik tombol \u003cb\u003ePAY\u003c/b\u003e","Transaksi selesai. Simpan bukti pembayaran Anda"]}]', '2026-03-28 19:14:06+07', '2026-03-28 18:22:06.077135+07', '2026-03-28 18:15:06.758621+07', '2026-03-28 18:22:06.077918+07', 0, 3093, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('b6251e0a-1968-44c1-91ec-097a89190336', 'DEV-T49021357115KQILZ', 'INV-1774697064431714300', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 3000, 103000, 'PAID', 'DANA', 'DANA', '', '', 'https://tripay.co.id/checkout/DEV-T49021357115KQILZ', '[{"title":"Pembayaran via DANA","steps":["Klik tombol Lanjutkan Pembayaran","Anda akan dipindah ke Halaman Pembayaran DANA ","Pastikan saldo DANA anda cukup","Masukkan nomor handpone yang terdaftar pada akun DANA","Anda akan diminta untuk memasukkan PIN DANA Anda","Kemudian anda akan diminta untuk memasukkan kode OTP yang dikirim ke nomor DANA","Kemudian akan muncul detail tansaksi pastikan sudah sesuai dengan transaksi yang ingin anda bayar","Klik tombol \u003cb\u003ePAY\u003c/b\u003e","Transaksi selesai. Simpan bukti pembayaran Anda"]}]', '2026-03-28 19:23:24+07', '2026-03-28 18:26:14.305129+07', '2026-03-28 18:24:24.791205+07', '2026-03-28 18:26:14.305667+07', 3000, 0, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('bdf8f8ce-4dc8-4d15-84f8-fb518c6dcc70', 'DEV-T49021357118KVBGJ', 'INV-1774697604596442700', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 3000, 103000, 'PAID', 'DANA', 'DANA', '', '', 'https://tripay.co.id/checkout/DEV-T49021357118KVBGJ', '[{"title":"Pembayaran via DANA","steps":["Klik tombol Lanjutkan Pembayaran","Anda akan dipindah ke Halaman Pembayaran DANA ","Pastikan saldo DANA anda cukup","Masukkan nomor handpone yang terdaftar pada akun DANA","Anda akan diminta untuk memasukkan PIN DANA Anda","Kemudian anda akan diminta untuk memasukkan kode OTP yang dikirim ke nomor DANA","Kemudian akan muncul detail tansaksi pastikan sudah sesuai dengan transaksi yang ingin anda bayar","Klik tombol \u003cb\u003ePAY\u003c/b\u003e","Transaksi selesai. Simpan bukti pembayaran Anda"]}]', '2026-03-28 19:32:24+07', '2026-03-28 18:36:43.59557+07', '2026-03-28 18:33:24.887973+07', '2026-03-28 18:36:43.5958+07', 3000, 0, NULL, NULL, NULL, NULL);
INSERT INTO public.payment_transactions VALUES ('a957e6e3-5508-424c-94f7-b76757a59c9b', 'MB-1774840073067561500', 'MB-1774840073067561500', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 0, 100000, 'PAID', 'test', 'test', 'MANUAL', '/uploads/payments/logo-test-1774840054.png', '', '[{"title": "Transfer Bank test", "steps": ["Silahkan transfer ke rekening 0723712313 a/n adt", "Upload bukti transfer di halaman invoice untuk verifikasi otomatis", ""]}]', '2026-03-31 10:07:53.067561+07', '2026-03-30 10:15:57.774917+07', '2026-03-30 10:07:53.067561+07', '2026-03-30 10:15:57.774917+07', 0, 0, '/uploads/payments/proof-a957e6e3-1774840539.jpg', 'ye', 'adt', '0723712313');


--
-- TOC entry 6050 (class 0 OID 26015)
-- Dependencies: 288
-- Data for Name: platform_budget_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.platform_budget_transfers VALUES ('82ac2d02-095a-4aae-b8ff-1528319a9441', 'Pajak PPN (11%)', 'gaji', 9000, 'p', '2026-03-30 07:00:00+07', '2026-03-30 17:13:20.085596+07', '2026-03-30 17:13:20.085596+07', 'TAKEN');


--
-- TOC entry 6022 (class 0 OID 25393)
-- Dependencies: 260
-- Data for Name: platform_expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.platform_expense_categories VALUES ('bdddb6d0-3db8-4591-bb69-7a5daf8c1937', 'gaji', 20, '2026-03-28 15:45:41.145066+07', '2026-03-28 15:45:41.145066+07', 'EXPENSE');
INSERT INTO public.platform_expense_categories VALUES ('1029704a-3846-4910-902c-e0b590fdadbe', 'server', 20, '2026-03-28 15:45:51.70751+07', '2026-03-28 15:45:51.70751+07', 'EXPENSE');
INSERT INTO public.platform_expense_categories VALUES ('c9630bbc-2e2a-4658-986a-0625920fdaf2', 'iklan', 60, '2026-03-28 15:46:02.269434+07', '2026-03-28 15:46:02.269434+07', 'EXPENSE');
INSERT INTO public.platform_expense_categories VALUES ('596572ce-ddf6-4525-b504-c4f8f4cd35cd', 'tim', 30, '2026-03-30 12:56:53.56733+07', '2026-03-30 12:56:53.56733+07', 'PROFIT');
INSERT INTO public.platform_expense_categories VALUES ('85a3c90f-0e97-4afa-9634-d2f5f44686cd', 'perusahaan', 70, '2026-03-30 12:57:13.973522+07', '2026-03-30 12:57:13.973522+07', 'PROFIT');


--
-- TOC entry 5998 (class 0 OID 16592)
-- Dependencies: 235
-- Data for Name: platform_expenses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.platform_expenses VALUES ('8166da53-31c9-48cd-9243-51942792c206', 'Biaya Gateway (TriPay)', 27843, 'p', '2026-03-30 07:00:00+07', '0001-01-01 06:42:04+06:42:04', '2026-03-30 14:45:29.892766+07');


--
-- TOC entry 5999 (class 0 OID 16602)
-- Dependencies: 236
-- Data for Name: savings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.savings VALUES ('a6769aff-6c8e-4dc2-bb20-032b28f790a1', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Makan harian', '3a793baf-84e4-4c04-9dca-bc695ed3268e', 'savings', 500000.00, 0.00, '🍲', 0, '2026-03-30 12:10:12.638072+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('55f0869e-7b26-4aee-b835-4186093a258c', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Ngopi', '3a793baf-84e4-4c04-9dca-bc695ed3268e', 'savings', 500000.00, 0.00, '☕', 0, '2026-03-30 12:10:12.665879+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('3e39a86c-ff73-42b6-8def-85d41c808739', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Jajan', '3a793baf-84e4-4c04-9dca-bc695ed3268e', 'savings', 500000.00, 0.00, '🍿', 0, '2026-03-30 12:10:12.666529+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('ca554796-d2fa-4c58-9dd0-6265f683c7f2', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Delivery (GoFood/GrabFood)', '3a793baf-84e4-4c04-9dca-bc695ed3268e', 'savings', 500000.00, 0.00, '🛵', 0, '2026-03-30 12:10:12.669442+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('c8330176-c58a-488d-9414-f35743299a2d', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Bensin', 'f50a22a1-cef7-4d9a-8bd4-b2b5e9413766', 'savings', 375000.00, 0.00, '⛽', 0, '2026-03-30 12:10:12.672124+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('a35c5313-2b10-4b10-8163-fe86439beb65', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Ojol', 'f50a22a1-cef7-4d9a-8bd4-b2b5e9413766', 'savings', 375000.00, 0.00, '🏍️', 0, '2026-03-30 12:10:12.673161+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('4b8c68ac-93a4-43b1-a4f6-540c10d9662a', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Parkir', 'f50a22a1-cef7-4d9a-8bd4-b2b5e9413766', 'savings', 375000.00, 0.00, '🅿️', 0, '2026-03-30 12:10:12.674333+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('448f8cea-63d9-4d65-a9a9-8ffd4d9d30ca', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Servis kendaraan', 'f50a22a1-cef7-4d9a-8bd4-b2b5e9413766', 'savings', 375000.00, 0.00, '🔧', 0, '2026-03-30 12:10:12.67484+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('3697e70a-daef-4971-9b55-4c85fae26483', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Listrik', '22884f29-b15c-44f9-aceb-88e46b3676cd', 'savings', 375000.00, 0.00, '⚡', 0, '2026-03-30 12:10:12.677126+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('5e8d513d-0711-4353-adb5-6054e5fd74a5', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Air', '22884f29-b15c-44f9-aceb-88e46b3676cd', 'savings', 375000.00, 0.00, '💧', 0, '2026-03-30 12:10:12.677799+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('cb8c9191-e327-4551-8e59-6287e94d5ace', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Internet', '22884f29-b15c-44f9-aceb-88e46b3676cd', 'savings', 375000.00, 0.00, '🌐', 0, '2026-03-30 12:10:12.678838+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('0e6275be-1ef2-43a6-9178-79dec30588e8', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Pulsa', '22884f29-b15c-44f9-aceb-88e46b3676cd', 'savings', 375000.00, 0.00, '📱', 0, '2026-03-30 12:10:12.67971+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('4c254607-5419-42dc-a53e-6990bc03fdb2', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Netflix', 'a3d0350a-1bc4-4c88-a7f8-35d71cf9fe5d', 'savings', 250000.00, 0.00, '📺', 0, '2026-03-30 12:10:12.684129+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('80d67543-79fb-4117-aaea-ffb5fdb0acbc', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Spotify', 'a3d0350a-1bc4-4c88-a7f8-35d71cf9fe5d', 'savings', 250000.00, 0.00, '🎧', 0, '2026-03-30 12:10:12.686718+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('b8b843b8-e668-481f-9df6-ca79f1bae819', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Nongkrong', 'a3d0350a-1bc4-4c88-a7f8-35d71cf9fe5d', 'savings', 250000.00, 0.00, '🤝', 0, '2026-03-30 12:10:12.687529+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('3aa4f32f-d9b5-49e7-bcc0-b68679cb7018', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Game', 'a3d0350a-1bc4-4c88-a7f8-35d71cf9fe5d', 'savings', 250000.00, 0.00, '🎮', 0, '2026-03-30 12:10:12.689183+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('bff52753-2903-4c3b-8408-8694f788e926', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Pakaian', '6e87b4d4-0031-484f-becb-80cd940cf938', 'savings', 500000.00, 0.00, '👕', 0, '2026-03-30 12:10:12.69143+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('8d3eb183-54bc-4979-98d9-39a23ec71e4f', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Skincare', '6e87b4d4-0031-484f-becb-80cd940cf938', 'savings', 500000.00, 0.00, '🧴', 0, '2026-03-30 12:10:12.692762+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('3e3aef17-cafc-41ef-a25e-d320de75fcf2', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Gadget', '6e87b4d4-0031-484f-becb-80cd940cf938', 'savings', 500000.00, 0.00, '📱', 0, '2026-03-30 12:10:12.693815+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('8bffbbf9-7c28-488c-8780-530dac94f99b', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Obat', '595dfd0c-5759-4caa-b0dc-ef74066af2e4', 'savings', 500000.00, 0.00, '💊', 0, '2026-03-30 12:10:12.695769+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('4a786cd2-9099-4a62-a64d-2e27c0a9f690', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Klinik', '595dfd0c-5759-4caa-b0dc-ef74066af2e4', 'savings', 500000.00, 0.00, '🏥', 0, '2026-03-30 12:10:12.696943+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('e6287c90-fa42-4b54-85d1-8e4f11baad99', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Asuransi', '595dfd0c-5759-4caa-b0dc-ef74066af2e4', 'savings', 500000.00, 0.00, '🛡️', 0, '2026-03-30 12:10:12.697453+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('e77b87ab-2b60-4b5e-9846-2fa39bc137d9', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Kursus', '38b4f61e-d587-4df6-a736-d59ae32e8eee', 'savings', 500000.00, 0.00, '🎓', 0, '2026-03-30 12:10:12.699548+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('a410c593-1b57-41c6-a969-b661d35ab018', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Buku', '38b4f61e-d587-4df6-a736-d59ae32e8eee', 'savings', 500000.00, 0.00, '📚', 0, '2026-03-30 12:10:12.700325+07', '3f032940-9551-4955-b7f7-591902e94eb1', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('610783b3-f846-44bc-a776-23f19c5236df', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Makan harian', 'f1dbb29d-515c-4f59-885a-9f9f1bbf2d7e', 'savings', 500000.00, 0.00, '🍲', 0, '2026-03-30 11:51:04.687724+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('1f80f0e7-5955-4d46-8a93-2560396854bb', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Ngopi', 'f1dbb29d-515c-4f59-885a-9f9f1bbf2d7e', 'savings', 500000.00, 0.00, '☕', 0, '2026-03-30 11:51:04.689687+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('6e5a79b6-d8d5-4d94-8de0-d3bc6674aaf0', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Jajan', 'f1dbb29d-515c-4f59-885a-9f9f1bbf2d7e', 'savings', 500000.00, 0.00, '🍿', 0, '2026-03-30 11:51:04.690805+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('d8dc5c64-4f90-44ea-b4b5-a5b61899386a', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Delivery (GoFood/GrabFood)', 'f1dbb29d-515c-4f59-885a-9f9f1bbf2d7e', 'savings', 500000.00, 0.00, '🛵', 0, '2026-03-30 11:51:04.691344+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('083390e2-2fc6-4c52-a247-901743ac188a', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Bensin', '03143cf2-9e48-46b6-964c-1a3e9f4bf6b5', 'savings', 375000.00, 0.00, '⛽', 0, '2026-03-30 11:51:04.694063+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('8552fc1d-fdb6-4cff-8f54-0cd93f4125f6', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Ojol', '03143cf2-9e48-46b6-964c-1a3e9f4bf6b5', 'savings', 375000.00, 0.00, '🏍️', 0, '2026-03-30 11:51:04.697022+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('929ab5c4-4f12-4467-985a-23559bb8a59b', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Parkir', '03143cf2-9e48-46b6-964c-1a3e9f4bf6b5', 'savings', 375000.00, 0.00, '🅿️', 0, '2026-03-30 11:51:04.699188+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('771e0842-329a-4748-9113-8ddb02c19b3c', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Servis kendaraan', '03143cf2-9e48-46b6-964c-1a3e9f4bf6b5', 'savings', 375000.00, 0.00, '🔧', 0, '2026-03-30 11:51:04.699831+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('3373c6ae-1ffe-48f0-8682-7ad326af1b93', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Listrik', '01edce4a-37d0-48e4-ac6f-b8c02e6bdad1', 'savings', 375000.00, 0.00, '⚡', 0, '2026-03-30 11:51:04.70204+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('f0edf3d4-d5fb-4773-a3a5-14150355e15d', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Air', '01edce4a-37d0-48e4-ac6f-b8c02e6bdad1', 'savings', 375000.00, 0.00, '💧', 0, '2026-03-30 11:51:04.704627+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('f28b6536-64fd-4431-b103-ecfa101d1ffc', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Internet', '01edce4a-37d0-48e4-ac6f-b8c02e6bdad1', 'savings', 375000.00, 0.00, '🌐', 0, '2026-03-30 11:51:04.707137+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('2e9f994d-4f81-4156-93d3-10a1fc708fc5', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Pulsa', '01edce4a-37d0-48e4-ac6f-b8c02e6bdad1', 'savings', 375000.00, 0.00, '📱', 0, '2026-03-30 11:51:04.70852+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('717d64df-08a7-4e7e-b25d-787b08271d5b', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Netflix', '8e7e6643-82a1-440a-8bb6-eeec47339b96', 'savings', 250000.00, 0.00, '📺', 0, '2026-03-30 11:51:04.711474+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('0156f1e7-f709-42f7-bf9e-933ec19f0aac', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Spotify', '8e7e6643-82a1-440a-8bb6-eeec47339b96', 'savings', 250000.00, 0.00, '🎧', 0, '2026-03-30 11:51:04.712738+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('28892463-4e54-4b3f-8f67-62cfb17f1fd8', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Nongkrong', '8e7e6643-82a1-440a-8bb6-eeec47339b96', 'savings', 250000.00, 0.00, '🤝', 0, '2026-03-30 11:51:04.714577+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('5e27eda8-3ae0-418e-b08a-b0561483ae70', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Game', '8e7e6643-82a1-440a-8bb6-eeec47339b96', 'savings', 250000.00, 0.00, '🎮', 0, '2026-03-30 11:51:04.715652+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('f3cccb22-ee37-45a6-8747-709a1a382a90', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Pakaian', '9beeeb6b-b29d-4e6c-bf00-757d57eccbd1', 'savings', 500000.00, 0.00, '👕', 0, '2026-03-30 11:51:04.718318+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('1d9d3759-9cdc-4fa4-a030-da550396aa94', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Skincare', '9beeeb6b-b29d-4e6c-bf00-757d57eccbd1', 'savings', 500000.00, 0.00, '🧴', 0, '2026-03-30 11:51:04.719139+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('d7800cdb-c54f-4086-9959-cc34954aa0ec', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Gadget', '9beeeb6b-b29d-4e6c-bf00-757d57eccbd1', 'savings', 500000.00, 0.00, '📱', 0, '2026-03-30 11:51:04.722636+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('a44fd33e-cc98-4f8f-b871-6159993424c6', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Obat', '06563caa-259d-4417-bc0e-7649d571730e', 'savings', 500000.00, 0.00, '💊', 0, '2026-03-30 11:51:04.727275+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('f78e3e45-922f-41c9-b2bd-dec3b26c5d95', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Klinik', '06563caa-259d-4417-bc0e-7649d571730e', 'savings', 500000.00, 0.00, '🏥', 0, '2026-03-30 11:51:04.728419+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('d70db408-55e8-4bc1-bff0-adcc769484fe', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Asuransi', '06563caa-259d-4417-bc0e-7649d571730e', 'savings', 500000.00, 0.00, '🛡️', 0, '2026-03-30 11:51:04.729522+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('023295b4-4cad-4dac-9448-5d57f51419e2', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Kursus', '10d33147-6750-4765-80cf-b94d6dd4fe62', 'savings', 500000.00, 0.00, '🎓', 0, '2026-03-30 11:51:04.731995+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);
INSERT INTO public.savings VALUES ('a6fe85ab-493b-4278-8e7f-3dda6047b0e3', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'Buku', '10d33147-6750-4765-80cf-b94d6dd4fe62', 'savings', 500000.00, 0.00, '📚', 0, '2026-03-30 11:51:04.733083+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', NULL, 3, 2026);


--
-- TOC entry 6000 (class 0 OID 16615)
-- Dependencies: 237
-- Data for Name: sitemap_configs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sitemap_configs VALUES ('476e88c0-1772-4bb5-9ecb-0d3e99e1bd1b', '/test-path-verification', false, true, 0.5, 'weekly', '2026-03-21 01:06:45.139946+07', '2026-03-21 01:47:03.046084+07', NULL);
INSERT INTO public.sitemap_configs VALUES ('ea2f960c-897b-42c7-9b61-3884c8e821a2', '/', false, true, 1, 'daily', '2026-03-21 06:05:22.826409+07', '2026-03-21 06:05:22.826409+07', NULL);
INSERT INTO public.sitemap_configs VALUES ('d809235e-c1e6-4073-bd90-18013213001d', '/pricing', false, true, 0.8, 'weekly', '2026-03-21 06:05:22.829024+07', '2026-03-21 06:05:22.829024+07', NULL);
INSERT INTO public.sitemap_configs VALUES ('ca61b20c-a9db-439c-9ae7-3d48b9443d80', '/about', false, true, 0.8, 'monthly', '2026-03-21 06:05:22.830956+07', '2026-03-21 06:05:22.830956+07', NULL);
INSERT INTO public.sitemap_configs VALUES ('38dbc554-0a34-4b4c-8ce7-88fc713ce0cf', '/contact', false, true, 0.8, 'monthly', '2026-03-21 06:05:22.831919+07', '2026-03-21 06:05:22.831919+07', NULL);
INSERT INTO public.sitemap_configs VALUES ('8aeb6d26-0fae-4823-b86f-3eb7f8c19378', '/blog', false, true, 1, 'daily', '2026-03-21 06:05:22.834002+07', '2026-03-21 06:05:22.834002+07', NULL);


--
-- TOC entry 6001 (class 0 OID 16626)
-- Dependencies: 238
-- Data for Name: sub_plans; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sub_plans VALUES ('732f17c5-8699-4ff5-9ada-d7fa51307608', 'Family', 50000, 5, 30, 'Pilihan populer untuk keluarga kecil', 'Hingga 5 Anggota;Laporan Mingguan & Bulanan;Analisis Anggaran;Target Menabung');
INSERT INTO public.sub_plans VALUES ('e7ee18af-1304-4d4d-8fb9-102f3158a6a4', 'Premium', 100000, 10, 360, 'Fitur lengkap untuk keluarga besar', 'Hingga 10 Anggota;Prioritas Support;Backup Otomatis;Manajemen Utang');
INSERT INTO public.sub_plans VALUES ('5d3aa5f1-3608-4575-9a77-2932b3a934f5', 'Standard', 25000, 2, 30, 'Cocok untuk pasangan muda', 'Hingga 2 Anggota;Laporan Bulanan;Multi Dompet;Eksport Data');


--
-- TOC entry 6002 (class 0 OID 16638)
-- Dependencies: 239
-- Data for Name: support_reports; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6003 (class 0 OID 16648)
-- Dependencies: 240
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.system_settings VALUES ('3e022f11-ff5d-4909-843d-9ebe8cf400f3', 'trial_max_members', '2', '2026-03-14 00:23:42.799849+07', '2026-03-14 00:23:42.799849+07');
INSERT INTO public.system_settings VALUES ('65d7582d-9434-4add-9585-89f89d3920ff', 'logo_url_light', '/uploads/system/logo_1773522612229184900.png', '2026-03-15 03:01:40.372435+07', '2026-03-15 04:10:14.895339+07');
INSERT INTO public.system_settings VALUES ('e169cc7d-d8a3-4425-b4ee-32eeb637fce4', 'logo_url_dark', '/uploads/system/logo_1773522662308750100.png', '2026-03-15 03:01:40.373953+07', '2026-03-15 04:11:03.583336+07');
INSERT INTO public.system_settings VALUES ('38e7ad4c-f2c2-4f79-9194-c6012ba93e55', 'website_name', 'UangKu', '2026-03-15 03:01:40.369681+07', '2026-03-15 04:17:48.755996+07');
INSERT INTO public.system_settings VALUES ('eaf3de17-e2da-480e-8446-bbe5c5ae27cf', 'trial_duration_days', '7', '2026-03-14 00:23:42.797588+07', '2026-03-27 10:55:12.108258+07');
INSERT INTO public.system_settings VALUES ('981627fc-5318-4caf-bc36-289cb3c0439d', 'resend_otp_duration', '60', '2026-03-27 12:54:07.788259+07', '2026-03-27 12:54:07.788259+07');
INSERT INTO public.system_settings VALUES ('c9bf1ff8-3114-41fa-a59a-7aeb17307030', 'otp_expiry_duration', '1', '2026-03-27 12:54:07.770885+07', '2026-03-27 15:19:42.223179+07');
INSERT INTO public.system_settings VALUES ('582b18e3-b018-4203-9759-89500cad0d7a', 'platform_expense_allocation_pct', '40', '2026-03-26 15:22:48.122635+07', '2026-03-30 13:26:21.910569+07');


--
-- TOC entry 6023 (class 0 OID 25405)
-- Dependencies: 261
-- Data for Name: transactions_2024_01; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6024 (class 0 OID 25428)
-- Dependencies: 262
-- Data for Name: transactions_2024_02; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6025 (class 0 OID 25451)
-- Dependencies: 263
-- Data for Name: transactions_2024_03; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6026 (class 0 OID 25474)
-- Dependencies: 264
-- Data for Name: transactions_2024_04; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6027 (class 0 OID 25497)
-- Dependencies: 265
-- Data for Name: transactions_2024_05; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6028 (class 0 OID 25520)
-- Dependencies: 266
-- Data for Name: transactions_2024_06; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6029 (class 0 OID 25543)
-- Dependencies: 267
-- Data for Name: transactions_2024_07; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6030 (class 0 OID 25566)
-- Dependencies: 268
-- Data for Name: transactions_2024_08; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6031 (class 0 OID 25589)
-- Dependencies: 269
-- Data for Name: transactions_2024_09; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6032 (class 0 OID 25612)
-- Dependencies: 270
-- Data for Name: transactions_2024_10; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6033 (class 0 OID 25635)
-- Dependencies: 271
-- Data for Name: transactions_2024_11; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6034 (class 0 OID 25658)
-- Dependencies: 272
-- Data for Name: transactions_2024_12; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6035 (class 0 OID 25681)
-- Dependencies: 273
-- Data for Name: transactions_2025_01; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6036 (class 0 OID 25704)
-- Dependencies: 274
-- Data for Name: transactions_2025_02; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6037 (class 0 OID 25727)
-- Dependencies: 275
-- Data for Name: transactions_2025_03; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6038 (class 0 OID 25750)
-- Dependencies: 276
-- Data for Name: transactions_2025_04; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6039 (class 0 OID 25773)
-- Dependencies: 277
-- Data for Name: transactions_2025_05; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6040 (class 0 OID 25796)
-- Dependencies: 278
-- Data for Name: transactions_2025_06; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6041 (class 0 OID 25819)
-- Dependencies: 279
-- Data for Name: transactions_2025_07; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6042 (class 0 OID 25842)
-- Dependencies: 280
-- Data for Name: transactions_2025_08; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6043 (class 0 OID 25865)
-- Dependencies: 281
-- Data for Name: transactions_2025_09; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6044 (class 0 OID 25888)
-- Dependencies: 282
-- Data for Name: transactions_2025_10; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6045 (class 0 OID 25911)
-- Dependencies: 283
-- Data for Name: transactions_2025_11; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6046 (class 0 OID 25934)
-- Dependencies: 284
-- Data for Name: transactions_2025_12; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6004 (class 0 OID 16669)
-- Dependencies: 242
-- Data for Name: transactions_2026_01; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6005 (class 0 OID 16684)
-- Dependencies: 243
-- Data for Name: transactions_2026_02; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions_2026_02 VALUES ('33120dbf-b1b0-439f-8850-1e5403657752', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', '1a34939a-ca0b-4b80-8361-7dcdb2333006', NULL, 'saving', 100000.00, 0.00, 'Bensin', '2026-02-28 07:00:00+07', 'p', NULL, '2026-03-28 12:00:45.222385+07', NULL);


--
-- TOC entry 6006 (class 0 OID 16699)
-- Dependencies: 244
-- Data for Name: transactions_2026_03; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions_2026_03 VALUES ('b392d5f0-ed8e-4e11-a124-ea7a689de01e', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', '1a34939a-ca0b-4b80-8361-7dcdb2333006', NULL, 'income', 100000.00, 0.00, 'Gaji', '2026-03-28 10:20:36.158+07', 'p', NULL, '2026-03-28 10:20:36.168978+07', NULL);
INSERT INTO public.transactions_2026_03 VALUES ('fbedbd15-9c24-4420-95bf-5d55e54b4350', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '3f032940-9551-4955-b7f7-591902e94eb1', '1a34939a-ca0b-4b80-8361-7dcdb2333006', NULL, 'expense', 10000.00, 0.00, 'debt_payment', '2026-03-30 07:00:00+07', 'Cicilan: p. ', NULL, '2026-03-30 12:23:58.662859+07', NULL);
INSERT INTO public.transactions_2026_03 VALUES ('873582d9-51f9-4658-8d69-095f186b6fe3', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', '96a8e49e-95c2-4222-870f-4cd3fdb022dd', '1a34939a-ca0b-4b80-8361-7dcdb2333006', 'transfer', 110000.00, 0.00, '', '2026-03-30 15:33:24.232+07', 'p', NULL, '2026-03-30 15:32:53.492658+07', NULL);
INSERT INTO public.transactions_2026_03 VALUES ('44a594d4-879c-425e-a8eb-6e0d99bc05bf', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', '67e17319-6ef7-43f0-841d-ce3531c0e0b3', '96a8e49e-95c2-4222-870f-4cd3fdb022dd', NULL, 'expense', 90000.00, 0.00, 'debt_payment', '2026-03-30 07:00:00+07', 'Cicilan: p. Cicilan p - Maret 2026', NULL, '2026-03-30 18:16:05.533361+07', NULL);


--
-- TOC entry 6007 (class 0 OID 16714)
-- Dependencies: 245
-- Data for Name: transactions_2026_04; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6008 (class 0 OID 16729)
-- Dependencies: 246
-- Data for Name: transactions_2026_05; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6009 (class 0 OID 16744)
-- Dependencies: 247
-- Data for Name: transactions_2026_06; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6010 (class 0 OID 16759)
-- Dependencies: 248
-- Data for Name: transactions_2026_07; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6011 (class 0 OID 16774)
-- Dependencies: 249
-- Data for Name: transactions_2026_08; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6012 (class 0 OID 16789)
-- Dependencies: 250
-- Data for Name: transactions_2026_09; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6013 (class 0 OID 16804)
-- Dependencies: 251
-- Data for Name: transactions_2026_10; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6014 (class 0 OID 16819)
-- Dependencies: 252
-- Data for Name: transactions_2026_11; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6015 (class 0 OID 16834)
-- Dependencies: 253
-- Data for Name: transactions_2026_12; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6016 (class 0 OID 16849)
-- Dependencies: 254
-- Data for Name: transactions_2027_01; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6017 (class 0 OID 16864)
-- Dependencies: 255
-- Data for Name: transactions_2027_02; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6018 (class 0 OID 16879)
-- Dependencies: 256
-- Data for Name: transactions_2027_03; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6047 (class 0 OID 25957)
-- Dependencies: 285
-- Data for Name: transactions_2027_04; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6019 (class 0 OID 16894)
-- Dependencies: 257
-- Data for Name: transactions_backup_20020; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 6020 (class 0 OID 16907)
-- Dependencies: 258
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('0c333f02-f095-4a47-9dd1-d6a15fcca928', 'strategist@uangku.id', '', '$2a$10$OnAbvJd/yAOw975nDet8yOi3slGSPexqX9SmQm.w4y0VxKUyJZ2.a', 'SEO Specialist', 'content_strategist', true, '', '0001-01-01 06:42:04+06:42:04', '', '0001-01-01 06:42:04+06:42:04', false, '2026-03-14 00:23:43.058029+07', NULL);
INSERT INTO public.users VALUES ('76e944be-ae0c-4790-83f2-308576e8b5a0', 'admin@gmail.com', '', '$2a$10$kdSPQK1.KJA91OHGJJD8GeOc4L7.l011qQO6KZa3hOd0MvLHDAUuy', 'Super Admin', 'super_admin', true, '', '0001-01-01 06:42:04+06:42:04', '', '0001-01-01 06:42:04+06:42:04', false, '2026-03-14 00:23:43.056007+07', NULL);
INSERT INTO public.users VALUES ('3f032940-9551-4955-b7f7-591902e94eb1', 'muhammadihya11289@gmail.com', '087755922894', '$2a$10$aEXk8e3zIXqWxK.u6GbVr.ZQZYwZ9KdYJEbp0FDyP4BD5wqe/eIQy', 'ihya', 'family_admin', true, '', '2026-03-27 11:38:14.792612+07', '', '0001-01-01 06:42:04+06:42:04', false, '2026-03-27 11:02:31.186281+07', NULL);
INSERT INTO public.users VALUES ('67e17319-6ef7-43f0-841d-ce3531c0e0b3', 'ihyamughniyah27@gmail.com', '0851002000', '$2a$10$eWqGGOBSpVTGCkwksYbQWuJSPUupuV0MtYlYT/foDkDBSFAjHziYa', 'olip', 'family_member', true, '', '2026-03-27 16:08:21.50645+07', '', '0001-01-01 06:42:04+06:42:04', false, '2026-03-27 16:04:23.652681+07', '2026-03-30 11:55:56.704391+07');


--
-- TOC entry 6021 (class 0 OID 16919)
-- Dependencies: 259
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.wallets VALUES ('01419ece-c445-4bb7-aef9-0f08f1580d0a', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'bca olip', 'Bank', '1231321233', 12312313.00, '2026-03-30 15:08:58.072313+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3');
INSERT INTO public.wallets VALUES ('1a34939a-ca0b-4b80-8361-7dcdb2333006', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'BCA IHYA', 'Bank', '01723187318', 300000.00, '2026-03-27 18:22:14.433955+07', '3f032940-9551-4955-b7f7-591902e94eb1');
INSERT INTO public.wallets VALUES ('96a8e49e-95c2-4222-870f-4cd3fdb022dd', 'e110c7d0-a45a-49be-b2a0-406c877a22ad', 'dana olip', 'Bank', '23132123123', 800000.00, '2026-03-30 10:31:10.557296+07', '67e17319-6ef7-43f0-841d-ce3531c0e0b3');


--
-- TOC entry 5351 (class 2606 OID 16930)
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- TOC entry 5356 (class 2606 OID 16932)
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5362 (class 2606 OID 16934)
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 5365 (class 2606 OID 16936)
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5651 (class 2606 OID 25991)
-- Name: budget_plans budget_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_plans
    ADD CONSTRAINT budget_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 5369 (class 2606 OID 16938)
-- Name: debt_payments debt_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5372 (class 2606 OID 16940)
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- TOC entry 5375 (class 2606 OID 16942)
-- Name: families families_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_pkey PRIMARY KEY (id);


--
-- TOC entry 5377 (class 2606 OID 16944)
-- Name: family_applications family_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_applications
    ADD CONSTRAINT family_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 5380 (class 2606 OID 16946)
-- Name: family_challenges family_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_challenges
    ADD CONSTRAINT family_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 5383 (class 2606 OID 16948)
-- Name: family_invitations family_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_invitations
    ADD CONSTRAINT family_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 5386 (class 2606 OID 16950)
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- TOC entry 5389 (class 2606 OID 16952)
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- TOC entry 5394 (class 2606 OID 16954)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5655 (class 2606 OID 26010)
-- Name: payment_channels payment_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_channels
    ADD CONSTRAINT payment_channels_pkey PRIMARY KEY (id);


--
-- TOC entry 5398 (class 2606 OID 16956)
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5660 (class 2606 OID 26026)
-- Name: platform_budget_transfers platform_budget_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_budget_transfers
    ADD CONSTRAINT platform_budget_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 5522 (class 2606 OID 25402)
-- Name: platform_expense_categories platform_expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_expense_categories
    ADD CONSTRAINT platform_expense_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5406 (class 2606 OID 16958)
-- Name: platform_expenses platform_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_expenses
    ADD CONSTRAINT platform_expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 5412 (class 2606 OID 16960)
-- Name: savings savings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings
    ADD CONSTRAINT savings_pkey PRIMARY KEY (id);


--
-- TOC entry 5416 (class 2606 OID 16962)
-- Name: sitemap_configs sitemap_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_configs
    ADD CONSTRAINT sitemap_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 5418 (class 2606 OID 16964)
-- Name: sub_plans sub_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_plans
    ADD CONSTRAINT sub_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 5420 (class 2606 OID 16966)
-- Name: support_reports support_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_reports
    ADD CONSTRAINT support_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 5423 (class 2606 OID 16968)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5428 (class 2606 OID 16970)
-- Name: transactions transactions_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey1 PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5528 (class 2606 OID 25411)
-- Name: transactions_2024_01 transactions_2024_01_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_01
    ADD CONSTRAINT transactions_2024_01_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5533 (class 2606 OID 25434)
-- Name: transactions_2024_02 transactions_2024_02_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_02
    ADD CONSTRAINT transactions_2024_02_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5538 (class 2606 OID 25457)
-- Name: transactions_2024_03 transactions_2024_03_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_03
    ADD CONSTRAINT transactions_2024_03_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5543 (class 2606 OID 25480)
-- Name: transactions_2024_04 transactions_2024_04_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_04
    ADD CONSTRAINT transactions_2024_04_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5548 (class 2606 OID 25503)
-- Name: transactions_2024_05 transactions_2024_05_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_05
    ADD CONSTRAINT transactions_2024_05_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5553 (class 2606 OID 25526)
-- Name: transactions_2024_06 transactions_2024_06_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_06
    ADD CONSTRAINT transactions_2024_06_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5558 (class 2606 OID 25549)
-- Name: transactions_2024_07 transactions_2024_07_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_07
    ADD CONSTRAINT transactions_2024_07_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5563 (class 2606 OID 25572)
-- Name: transactions_2024_08 transactions_2024_08_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_08
    ADD CONSTRAINT transactions_2024_08_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5568 (class 2606 OID 25595)
-- Name: transactions_2024_09 transactions_2024_09_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_09
    ADD CONSTRAINT transactions_2024_09_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5573 (class 2606 OID 25618)
-- Name: transactions_2024_10 transactions_2024_10_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_10
    ADD CONSTRAINT transactions_2024_10_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5578 (class 2606 OID 25641)
-- Name: transactions_2024_11 transactions_2024_11_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_11
    ADD CONSTRAINT transactions_2024_11_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5583 (class 2606 OID 25664)
-- Name: transactions_2024_12 transactions_2024_12_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2024_12
    ADD CONSTRAINT transactions_2024_12_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5588 (class 2606 OID 25687)
-- Name: transactions_2025_01 transactions_2025_01_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_01
    ADD CONSTRAINT transactions_2025_01_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5593 (class 2606 OID 25710)
-- Name: transactions_2025_02 transactions_2025_02_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_02
    ADD CONSTRAINT transactions_2025_02_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5598 (class 2606 OID 25733)
-- Name: transactions_2025_03 transactions_2025_03_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_03
    ADD CONSTRAINT transactions_2025_03_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5603 (class 2606 OID 25756)
-- Name: transactions_2025_04 transactions_2025_04_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_04
    ADD CONSTRAINT transactions_2025_04_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5608 (class 2606 OID 25779)
-- Name: transactions_2025_05 transactions_2025_05_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_05
    ADD CONSTRAINT transactions_2025_05_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5613 (class 2606 OID 25802)
-- Name: transactions_2025_06 transactions_2025_06_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_06
    ADD CONSTRAINT transactions_2025_06_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5618 (class 2606 OID 25825)
-- Name: transactions_2025_07 transactions_2025_07_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_07
    ADD CONSTRAINT transactions_2025_07_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5623 (class 2606 OID 25848)
-- Name: transactions_2025_08 transactions_2025_08_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_08
    ADD CONSTRAINT transactions_2025_08_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5628 (class 2606 OID 25871)
-- Name: transactions_2025_09 transactions_2025_09_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_09
    ADD CONSTRAINT transactions_2025_09_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5633 (class 2606 OID 25894)
-- Name: transactions_2025_10 transactions_2025_10_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_10
    ADD CONSTRAINT transactions_2025_10_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5638 (class 2606 OID 25917)
-- Name: transactions_2025_11 transactions_2025_11_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_11
    ADD CONSTRAINT transactions_2025_11_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5643 (class 2606 OID 25940)
-- Name: transactions_2025_12 transactions_2025_12_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2025_12
    ADD CONSTRAINT transactions_2025_12_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5432 (class 2606 OID 16972)
-- Name: transactions_2026_01 transactions_2026_01_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_01
    ADD CONSTRAINT transactions_2026_01_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5437 (class 2606 OID 16974)
-- Name: transactions_2026_02 transactions_2026_02_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_02
    ADD CONSTRAINT transactions_2026_02_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5442 (class 2606 OID 16976)
-- Name: transactions_2026_03 transactions_2026_03_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_03
    ADD CONSTRAINT transactions_2026_03_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5447 (class 2606 OID 16978)
-- Name: transactions_2026_04 transactions_2026_04_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_04
    ADD CONSTRAINT transactions_2026_04_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5452 (class 2606 OID 16980)
-- Name: transactions_2026_05 transactions_2026_05_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_05
    ADD CONSTRAINT transactions_2026_05_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5457 (class 2606 OID 16982)
-- Name: transactions_2026_06 transactions_2026_06_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_06
    ADD CONSTRAINT transactions_2026_06_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5462 (class 2606 OID 16984)
-- Name: transactions_2026_07 transactions_2026_07_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_07
    ADD CONSTRAINT transactions_2026_07_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5467 (class 2606 OID 16986)
-- Name: transactions_2026_08 transactions_2026_08_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_08
    ADD CONSTRAINT transactions_2026_08_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5472 (class 2606 OID 16988)
-- Name: transactions_2026_09 transactions_2026_09_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_09
    ADD CONSTRAINT transactions_2026_09_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5477 (class 2606 OID 16990)
-- Name: transactions_2026_10 transactions_2026_10_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_10
    ADD CONSTRAINT transactions_2026_10_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5482 (class 2606 OID 16992)
-- Name: transactions_2026_11 transactions_2026_11_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_11
    ADD CONSTRAINT transactions_2026_11_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5487 (class 2606 OID 16994)
-- Name: transactions_2026_12 transactions_2026_12_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2026_12
    ADD CONSTRAINT transactions_2026_12_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5492 (class 2606 OID 16996)
-- Name: transactions_2027_01 transactions_2027_01_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2027_01
    ADD CONSTRAINT transactions_2027_01_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5497 (class 2606 OID 16998)
-- Name: transactions_2027_02 transactions_2027_02_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2027_02
    ADD CONSTRAINT transactions_2027_02_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5502 (class 2606 OID 17000)
-- Name: transactions_2027_03 transactions_2027_03_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2027_03
    ADD CONSTRAINT transactions_2027_03_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5648 (class 2606 OID 25963)
-- Name: transactions_2027_04 transactions_2027_04_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_2027_04
    ADD CONSTRAINT transactions_2027_04_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5510 (class 2606 OID 17002)
-- Name: transactions_backup_20020 transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_backup_20020
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id, family_id, date);


--
-- TOC entry 5358 (class 2606 OID 17004)
-- Name: blog_categories uni_blog_categories_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT uni_blog_categories_name UNIQUE (name);


--
-- TOC entry 5360 (class 2606 OID 17006)
-- Name: blog_categories uni_blog_categories_slug; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT uni_blog_categories_slug UNIQUE (slug);


--
-- TOC entry 5400 (class 2606 OID 17008)
-- Name: payment_transactions uni_payment_transactions_merchant_ref; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT uni_payment_transactions_merchant_ref UNIQUE (merchant_ref);


--
-- TOC entry 5402 (class 2606 OID 17010)
-- Name: payment_transactions uni_payment_transactions_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT uni_payment_transactions_reference UNIQUE (reference);


--
-- TOC entry 5524 (class 2606 OID 25404)
-- Name: platform_expense_categories uni_platform_expense_categories_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_expense_categories
    ADD CONSTRAINT uni_platform_expense_categories_name UNIQUE (name);


--
-- TOC entry 5515 (class 2606 OID 17012)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5519 (class 2606 OID 17014)
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 5352 (class 1259 OID 17015)
-- Name: idx_assets_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_family_id ON public.assets USING btree (family_id);


--
-- TOC entry 5353 (class 1259 OID 17016)
-- Name: idx_assets_goal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_goal_id ON public.assets USING btree (goal_id);


--
-- TOC entry 5354 (class 1259 OID 25387)
-- Name: idx_assets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_user_id ON public.assets USING btree (user_id);


--
-- TOC entry 5363 (class 1259 OID 17017)
-- Name: idx_blog_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);


--
-- TOC entry 5366 (class 1259 OID 17018)
-- Name: idx_budget_categories_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_categories_family_id ON public.budget_categories USING btree (family_id);


--
-- TOC entry 5367 (class 1259 OID 17218)
-- Name: idx_budget_categories_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_categories_user_id ON public.budget_categories USING btree (user_id);


--
-- TOC entry 5652 (class 1259 OID 25992)
-- Name: idx_budget_family_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_family_user_date ON public.budget_plans USING btree (family_id, user_id, year, month);


--
-- TOC entry 5370 (class 1259 OID 17019)
-- Name: idx_debt_payments_debt_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments USING btree (debt_id);


--
-- TOC entry 5373 (class 1259 OID 17020)
-- Name: idx_debts_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debts_family_id ON public.debts USING btree (family_id);


--
-- TOC entry 5378 (class 1259 OID 17021)
-- Name: idx_family_applications_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_family_applications_email ON public.family_applications USING btree (email);


--
-- TOC entry 5381 (class 1259 OID 17022)
-- Name: idx_family_challenges_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_family_challenges_family_id ON public.family_challenges USING btree (family_id);


--
-- TOC entry 5384 (class 1259 OID 17023)
-- Name: idx_family_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_family_invitations_email ON public.family_invitations USING btree (email);


--
-- TOC entry 5387 (class 1259 OID 17024)
-- Name: idx_family_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_family_user ON public.family_members USING btree (family_id, user_id);


--
-- TOC entry 5390 (class 1259 OID 17025)
-- Name: idx_goals_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_family_id ON public.goals USING btree (family_id);


--
-- TOC entry 5391 (class 1259 OID 17233)
-- Name: idx_goals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_user_id ON public.goals USING btree (user_id);


--
-- TOC entry 5392 (class 1259 OID 17026)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 5653 (class 1259 OID 26011)
-- Name: idx_payment_channels_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payment_channels_code ON public.payment_channels USING btree (code);


--
-- TOC entry 5395 (class 1259 OID 17027)
-- Name: idx_payment_transactions_merchant_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_merchant_ref ON public.payment_transactions USING btree (merchant_ref);


--
-- TOC entry 5396 (class 1259 OID 17028)
-- Name: idx_payment_transactions_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_reference ON public.payment_transactions USING btree (reference);


--
-- TOC entry 5656 (class 1259 OID 26029)
-- Name: idx_platform_budget_transfers_from_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_budget_transfers_from_category ON public.platform_budget_transfers USING btree (from_category);


--
-- TOC entry 5657 (class 1259 OID 26028)
-- Name: idx_platform_budget_transfers_to_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_budget_transfers_to_category ON public.platform_budget_transfers USING btree (to_category);


--
-- TOC entry 5658 (class 1259 OID 26027)
-- Name: idx_platform_budget_transfers_transfer_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_budget_transfers_transfer_date ON public.platform_budget_transfers USING btree (transfer_date);


--
-- TOC entry 5520 (class 1259 OID 26014)
-- Name: idx_platform_expense_categories_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_expense_categories_type ON public.platform_expense_categories USING btree (type);


--
-- TOC entry 5403 (class 1259 OID 17029)
-- Name: idx_platform_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_expenses_category ON public.platform_expenses USING btree (category);


--
-- TOC entry 5404 (class 1259 OID 17030)
-- Name: idx_platform_expenses_expense_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_expenses_expense_date ON public.platform_expenses USING btree (expense_date);


--
-- TOC entry 5407 (class 1259 OID 17031)
-- Name: idx_savings_budget_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savings_budget_category_id ON public.savings USING btree (budget_category_id);


--
-- TOC entry 5408 (class 1259 OID 17032)
-- Name: idx_savings_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savings_family_id ON public.savings USING btree (family_id);


--
-- TOC entry 5409 (class 1259 OID 17230)
-- Name: idx_savings_target_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savings_target_user_id ON public.savings USING btree (target_user_id);


--
-- TOC entry 5410 (class 1259 OID 17224)
-- Name: idx_savings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savings_user_id ON public.savings USING btree (user_id);


--
-- TOC entry 5413 (class 1259 OID 17033)
-- Name: idx_sitemap_configs_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sitemap_configs_deleted_at ON public.sitemap_configs USING btree (deleted_at);


--
-- TOC entry 5414 (class 1259 OID 17034)
-- Name: idx_sitemap_configs_path; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sitemap_configs_path ON public.sitemap_configs USING btree (path);


--
-- TOC entry 5421 (class 1259 OID 17035)
-- Name: idx_system_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_system_settings_key ON public.system_settings USING btree (key);


--
-- TOC entry 5424 (class 1259 OID 17036)
-- Name: idx_transactions_family_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_family_date ON ONLY public.transactions USING btree (family_id, date DESC);


--
-- TOC entry 5425 (class 1259 OID 17037)
-- Name: idx_transactions_goal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_goal_id ON ONLY public.transactions USING btree (goal_id);


--
-- TOC entry 5504 (class 1259 OID 17038)
-- Name: idx_transactions_saving_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_saving_id ON public.transactions_backup_20020 USING btree (saving_id);


--
-- TOC entry 5505 (class 1259 OID 17039)
-- Name: idx_transactions_to_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_to_wallet_id ON public.transactions_backup_20020 USING btree (to_wallet_id);


--
-- TOC entry 5426 (class 1259 OID 17040)
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_id ON ONLY public.transactions USING btree (user_id);


--
-- TOC entry 5506 (class 1259 OID 17041)
-- Name: idx_transactions_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_wallet_id ON public.transactions_backup_20020 USING btree (wallet_id);


--
-- TOC entry 5507 (class 1259 OID 17042)
-- Name: idx_tx_family_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tx_family_date ON public.transactions_backup_20020 USING btree (family_id, date);


--
-- TOC entry 5508 (class 1259 OID 17043)
-- Name: idx_tx_family_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tx_family_user ON public.transactions_backup_20020 USING btree (user_id);


--
-- TOC entry 5511 (class 1259 OID 17044)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5512 (class 1259 OID 17045)
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_phone ON public.users USING btree (phone_number) WHERE (phone_number <> ''::text);


--
-- TOC entry 5513 (class 1259 OID 17046)
-- Name: idx_users_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_reset_token ON public.users USING btree (reset_token);


--
-- TOC entry 5516 (class 1259 OID 17047)
-- Name: idx_wallets_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallets_family_id ON public.wallets USING btree (family_id);


--
-- TOC entry 5517 (class 1259 OID 17198)
-- Name: idx_wallets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id);


--
-- TOC entry 5525 (class 1259 OID 25412)
-- Name: transactions_2024_01_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_01_family_id_date_idx ON public.transactions_2024_01 USING btree (family_id, date DESC);


--
-- TOC entry 5526 (class 1259 OID 25413)
-- Name: transactions_2024_01_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_01_goal_id_idx ON public.transactions_2024_01 USING btree (goal_id);


--
-- TOC entry 5529 (class 1259 OID 25414)
-- Name: transactions_2024_01_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_01_user_id_idx ON public.transactions_2024_01 USING btree (user_id);


--
-- TOC entry 5530 (class 1259 OID 25435)
-- Name: transactions_2024_02_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_02_family_id_date_idx ON public.transactions_2024_02 USING btree (family_id, date DESC);


--
-- TOC entry 5531 (class 1259 OID 25436)
-- Name: transactions_2024_02_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_02_goal_id_idx ON public.transactions_2024_02 USING btree (goal_id);


--
-- TOC entry 5534 (class 1259 OID 25437)
-- Name: transactions_2024_02_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_02_user_id_idx ON public.transactions_2024_02 USING btree (user_id);


--
-- TOC entry 5535 (class 1259 OID 25458)
-- Name: transactions_2024_03_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_03_family_id_date_idx ON public.transactions_2024_03 USING btree (family_id, date DESC);


--
-- TOC entry 5536 (class 1259 OID 25459)
-- Name: transactions_2024_03_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_03_goal_id_idx ON public.transactions_2024_03 USING btree (goal_id);


--
-- TOC entry 5539 (class 1259 OID 25460)
-- Name: transactions_2024_03_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_03_user_id_idx ON public.transactions_2024_03 USING btree (user_id);


--
-- TOC entry 5540 (class 1259 OID 25481)
-- Name: transactions_2024_04_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_04_family_id_date_idx ON public.transactions_2024_04 USING btree (family_id, date DESC);


--
-- TOC entry 5541 (class 1259 OID 25482)
-- Name: transactions_2024_04_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_04_goal_id_idx ON public.transactions_2024_04 USING btree (goal_id);


--
-- TOC entry 5544 (class 1259 OID 25483)
-- Name: transactions_2024_04_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_04_user_id_idx ON public.transactions_2024_04 USING btree (user_id);


--
-- TOC entry 5545 (class 1259 OID 25504)
-- Name: transactions_2024_05_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_05_family_id_date_idx ON public.transactions_2024_05 USING btree (family_id, date DESC);


--
-- TOC entry 5546 (class 1259 OID 25505)
-- Name: transactions_2024_05_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_05_goal_id_idx ON public.transactions_2024_05 USING btree (goal_id);


--
-- TOC entry 5549 (class 1259 OID 25506)
-- Name: transactions_2024_05_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_05_user_id_idx ON public.transactions_2024_05 USING btree (user_id);


--
-- TOC entry 5550 (class 1259 OID 25527)
-- Name: transactions_2024_06_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_06_family_id_date_idx ON public.transactions_2024_06 USING btree (family_id, date DESC);


--
-- TOC entry 5551 (class 1259 OID 25528)
-- Name: transactions_2024_06_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_06_goal_id_idx ON public.transactions_2024_06 USING btree (goal_id);


--
-- TOC entry 5554 (class 1259 OID 25529)
-- Name: transactions_2024_06_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_06_user_id_idx ON public.transactions_2024_06 USING btree (user_id);


--
-- TOC entry 5555 (class 1259 OID 25550)
-- Name: transactions_2024_07_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_07_family_id_date_idx ON public.transactions_2024_07 USING btree (family_id, date DESC);


--
-- TOC entry 5556 (class 1259 OID 25551)
-- Name: transactions_2024_07_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_07_goal_id_idx ON public.transactions_2024_07 USING btree (goal_id);


--
-- TOC entry 5559 (class 1259 OID 25552)
-- Name: transactions_2024_07_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_07_user_id_idx ON public.transactions_2024_07 USING btree (user_id);


--
-- TOC entry 5560 (class 1259 OID 25573)
-- Name: transactions_2024_08_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_08_family_id_date_idx ON public.transactions_2024_08 USING btree (family_id, date DESC);


--
-- TOC entry 5561 (class 1259 OID 25574)
-- Name: transactions_2024_08_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_08_goal_id_idx ON public.transactions_2024_08 USING btree (goal_id);


--
-- TOC entry 5564 (class 1259 OID 25575)
-- Name: transactions_2024_08_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_08_user_id_idx ON public.transactions_2024_08 USING btree (user_id);


--
-- TOC entry 5565 (class 1259 OID 25596)
-- Name: transactions_2024_09_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_09_family_id_date_idx ON public.transactions_2024_09 USING btree (family_id, date DESC);


--
-- TOC entry 5566 (class 1259 OID 25597)
-- Name: transactions_2024_09_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_09_goal_id_idx ON public.transactions_2024_09 USING btree (goal_id);


--
-- TOC entry 5569 (class 1259 OID 25598)
-- Name: transactions_2024_09_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_09_user_id_idx ON public.transactions_2024_09 USING btree (user_id);


--
-- TOC entry 5570 (class 1259 OID 25619)
-- Name: transactions_2024_10_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_10_family_id_date_idx ON public.transactions_2024_10 USING btree (family_id, date DESC);


--
-- TOC entry 5571 (class 1259 OID 25620)
-- Name: transactions_2024_10_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_10_goal_id_idx ON public.transactions_2024_10 USING btree (goal_id);


--
-- TOC entry 5574 (class 1259 OID 25621)
-- Name: transactions_2024_10_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_10_user_id_idx ON public.transactions_2024_10 USING btree (user_id);


--
-- TOC entry 5575 (class 1259 OID 25642)
-- Name: transactions_2024_11_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_11_family_id_date_idx ON public.transactions_2024_11 USING btree (family_id, date DESC);


--
-- TOC entry 5576 (class 1259 OID 25643)
-- Name: transactions_2024_11_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_11_goal_id_idx ON public.transactions_2024_11 USING btree (goal_id);


--
-- TOC entry 5579 (class 1259 OID 25644)
-- Name: transactions_2024_11_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_11_user_id_idx ON public.transactions_2024_11 USING btree (user_id);


--
-- TOC entry 5580 (class 1259 OID 25665)
-- Name: transactions_2024_12_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_12_family_id_date_idx ON public.transactions_2024_12 USING btree (family_id, date DESC);


--
-- TOC entry 5581 (class 1259 OID 25666)
-- Name: transactions_2024_12_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_12_goal_id_idx ON public.transactions_2024_12 USING btree (goal_id);


--
-- TOC entry 5584 (class 1259 OID 25667)
-- Name: transactions_2024_12_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2024_12_user_id_idx ON public.transactions_2024_12 USING btree (user_id);


--
-- TOC entry 5585 (class 1259 OID 25688)
-- Name: transactions_2025_01_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_01_family_id_date_idx ON public.transactions_2025_01 USING btree (family_id, date DESC);


--
-- TOC entry 5586 (class 1259 OID 25689)
-- Name: transactions_2025_01_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_01_goal_id_idx ON public.transactions_2025_01 USING btree (goal_id);


--
-- TOC entry 5589 (class 1259 OID 25690)
-- Name: transactions_2025_01_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_01_user_id_idx ON public.transactions_2025_01 USING btree (user_id);


--
-- TOC entry 5590 (class 1259 OID 25711)
-- Name: transactions_2025_02_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_02_family_id_date_idx ON public.transactions_2025_02 USING btree (family_id, date DESC);


--
-- TOC entry 5591 (class 1259 OID 25712)
-- Name: transactions_2025_02_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_02_goal_id_idx ON public.transactions_2025_02 USING btree (goal_id);


--
-- TOC entry 5594 (class 1259 OID 25713)
-- Name: transactions_2025_02_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_02_user_id_idx ON public.transactions_2025_02 USING btree (user_id);


--
-- TOC entry 5595 (class 1259 OID 25734)
-- Name: transactions_2025_03_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_03_family_id_date_idx ON public.transactions_2025_03 USING btree (family_id, date DESC);


--
-- TOC entry 5596 (class 1259 OID 25735)
-- Name: transactions_2025_03_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_03_goal_id_idx ON public.transactions_2025_03 USING btree (goal_id);


--
-- TOC entry 5599 (class 1259 OID 25736)
-- Name: transactions_2025_03_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_03_user_id_idx ON public.transactions_2025_03 USING btree (user_id);


--
-- TOC entry 5600 (class 1259 OID 25757)
-- Name: transactions_2025_04_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_04_family_id_date_idx ON public.transactions_2025_04 USING btree (family_id, date DESC);


--
-- TOC entry 5601 (class 1259 OID 25758)
-- Name: transactions_2025_04_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_04_goal_id_idx ON public.transactions_2025_04 USING btree (goal_id);


--
-- TOC entry 5604 (class 1259 OID 25759)
-- Name: transactions_2025_04_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_04_user_id_idx ON public.transactions_2025_04 USING btree (user_id);


--
-- TOC entry 5605 (class 1259 OID 25780)
-- Name: transactions_2025_05_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_05_family_id_date_idx ON public.transactions_2025_05 USING btree (family_id, date DESC);


--
-- TOC entry 5606 (class 1259 OID 25781)
-- Name: transactions_2025_05_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_05_goal_id_idx ON public.transactions_2025_05 USING btree (goal_id);


--
-- TOC entry 5609 (class 1259 OID 25782)
-- Name: transactions_2025_05_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_05_user_id_idx ON public.transactions_2025_05 USING btree (user_id);


--
-- TOC entry 5610 (class 1259 OID 25803)
-- Name: transactions_2025_06_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_06_family_id_date_idx ON public.transactions_2025_06 USING btree (family_id, date DESC);


--
-- TOC entry 5611 (class 1259 OID 25804)
-- Name: transactions_2025_06_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_06_goal_id_idx ON public.transactions_2025_06 USING btree (goal_id);


--
-- TOC entry 5614 (class 1259 OID 25805)
-- Name: transactions_2025_06_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_06_user_id_idx ON public.transactions_2025_06 USING btree (user_id);


--
-- TOC entry 5615 (class 1259 OID 25826)
-- Name: transactions_2025_07_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_07_family_id_date_idx ON public.transactions_2025_07 USING btree (family_id, date DESC);


--
-- TOC entry 5616 (class 1259 OID 25827)
-- Name: transactions_2025_07_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_07_goal_id_idx ON public.transactions_2025_07 USING btree (goal_id);


--
-- TOC entry 5619 (class 1259 OID 25828)
-- Name: transactions_2025_07_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_07_user_id_idx ON public.transactions_2025_07 USING btree (user_id);


--
-- TOC entry 5620 (class 1259 OID 25849)
-- Name: transactions_2025_08_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_08_family_id_date_idx ON public.transactions_2025_08 USING btree (family_id, date DESC);


--
-- TOC entry 5621 (class 1259 OID 25850)
-- Name: transactions_2025_08_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_08_goal_id_idx ON public.transactions_2025_08 USING btree (goal_id);


--
-- TOC entry 5624 (class 1259 OID 25851)
-- Name: transactions_2025_08_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_08_user_id_idx ON public.transactions_2025_08 USING btree (user_id);


--
-- TOC entry 5625 (class 1259 OID 25872)
-- Name: transactions_2025_09_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_09_family_id_date_idx ON public.transactions_2025_09 USING btree (family_id, date DESC);


--
-- TOC entry 5626 (class 1259 OID 25873)
-- Name: transactions_2025_09_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_09_goal_id_idx ON public.transactions_2025_09 USING btree (goal_id);


--
-- TOC entry 5629 (class 1259 OID 25874)
-- Name: transactions_2025_09_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_09_user_id_idx ON public.transactions_2025_09 USING btree (user_id);


--
-- TOC entry 5630 (class 1259 OID 25895)
-- Name: transactions_2025_10_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_10_family_id_date_idx ON public.transactions_2025_10 USING btree (family_id, date DESC);


--
-- TOC entry 5631 (class 1259 OID 25896)
-- Name: transactions_2025_10_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_10_goal_id_idx ON public.transactions_2025_10 USING btree (goal_id);


--
-- TOC entry 5634 (class 1259 OID 25897)
-- Name: transactions_2025_10_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_10_user_id_idx ON public.transactions_2025_10 USING btree (user_id);


--
-- TOC entry 5635 (class 1259 OID 25918)
-- Name: transactions_2025_11_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_11_family_id_date_idx ON public.transactions_2025_11 USING btree (family_id, date DESC);


--
-- TOC entry 5636 (class 1259 OID 25919)
-- Name: transactions_2025_11_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_11_goal_id_idx ON public.transactions_2025_11 USING btree (goal_id);


--
-- TOC entry 5639 (class 1259 OID 25920)
-- Name: transactions_2025_11_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_11_user_id_idx ON public.transactions_2025_11 USING btree (user_id);


--
-- TOC entry 5640 (class 1259 OID 25941)
-- Name: transactions_2025_12_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_12_family_id_date_idx ON public.transactions_2025_12 USING btree (family_id, date DESC);


--
-- TOC entry 5641 (class 1259 OID 25942)
-- Name: transactions_2025_12_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_12_goal_id_idx ON public.transactions_2025_12 USING btree (goal_id);


--
-- TOC entry 5644 (class 1259 OID 25943)
-- Name: transactions_2025_12_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2025_12_user_id_idx ON public.transactions_2025_12 USING btree (user_id);


--
-- TOC entry 5429 (class 1259 OID 17048)
-- Name: transactions_2026_01_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_01_family_id_date_idx ON public.transactions_2026_01 USING btree (family_id, date DESC);


--
-- TOC entry 5430 (class 1259 OID 17049)
-- Name: transactions_2026_01_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_01_goal_id_idx ON public.transactions_2026_01 USING btree (goal_id);


--
-- TOC entry 5433 (class 1259 OID 17050)
-- Name: transactions_2026_01_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_01_user_id_idx ON public.transactions_2026_01 USING btree (user_id);


--
-- TOC entry 5434 (class 1259 OID 17051)
-- Name: transactions_2026_02_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_02_family_id_date_idx ON public.transactions_2026_02 USING btree (family_id, date DESC);


--
-- TOC entry 5435 (class 1259 OID 17052)
-- Name: transactions_2026_02_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_02_goal_id_idx ON public.transactions_2026_02 USING btree (goal_id);


--
-- TOC entry 5438 (class 1259 OID 17053)
-- Name: transactions_2026_02_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_02_user_id_idx ON public.transactions_2026_02 USING btree (user_id);


--
-- TOC entry 5439 (class 1259 OID 17054)
-- Name: transactions_2026_03_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_03_family_id_date_idx ON public.transactions_2026_03 USING btree (family_id, date DESC);


--
-- TOC entry 5440 (class 1259 OID 17055)
-- Name: transactions_2026_03_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_03_goal_id_idx ON public.transactions_2026_03 USING btree (goal_id);


--
-- TOC entry 5443 (class 1259 OID 17056)
-- Name: transactions_2026_03_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_03_user_id_idx ON public.transactions_2026_03 USING btree (user_id);


--
-- TOC entry 5444 (class 1259 OID 17057)
-- Name: transactions_2026_04_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_04_family_id_date_idx ON public.transactions_2026_04 USING btree (family_id, date DESC);


--
-- TOC entry 5445 (class 1259 OID 17058)
-- Name: transactions_2026_04_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_04_goal_id_idx ON public.transactions_2026_04 USING btree (goal_id);


--
-- TOC entry 5448 (class 1259 OID 17059)
-- Name: transactions_2026_04_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_04_user_id_idx ON public.transactions_2026_04 USING btree (user_id);


--
-- TOC entry 5449 (class 1259 OID 17060)
-- Name: transactions_2026_05_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_05_family_id_date_idx ON public.transactions_2026_05 USING btree (family_id, date DESC);


--
-- TOC entry 5450 (class 1259 OID 17061)
-- Name: transactions_2026_05_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_05_goal_id_idx ON public.transactions_2026_05 USING btree (goal_id);


--
-- TOC entry 5453 (class 1259 OID 17062)
-- Name: transactions_2026_05_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_05_user_id_idx ON public.transactions_2026_05 USING btree (user_id);


--
-- TOC entry 5454 (class 1259 OID 17063)
-- Name: transactions_2026_06_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_06_family_id_date_idx ON public.transactions_2026_06 USING btree (family_id, date DESC);


--
-- TOC entry 5455 (class 1259 OID 17064)
-- Name: transactions_2026_06_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_06_goal_id_idx ON public.transactions_2026_06 USING btree (goal_id);


--
-- TOC entry 5458 (class 1259 OID 17065)
-- Name: transactions_2026_06_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_06_user_id_idx ON public.transactions_2026_06 USING btree (user_id);


--
-- TOC entry 5459 (class 1259 OID 17066)
-- Name: transactions_2026_07_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_07_family_id_date_idx ON public.transactions_2026_07 USING btree (family_id, date DESC);


--
-- TOC entry 5460 (class 1259 OID 17067)
-- Name: transactions_2026_07_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_07_goal_id_idx ON public.transactions_2026_07 USING btree (goal_id);


--
-- TOC entry 5463 (class 1259 OID 17068)
-- Name: transactions_2026_07_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_07_user_id_idx ON public.transactions_2026_07 USING btree (user_id);


--
-- TOC entry 5464 (class 1259 OID 17069)
-- Name: transactions_2026_08_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_08_family_id_date_idx ON public.transactions_2026_08 USING btree (family_id, date DESC);


--
-- TOC entry 5465 (class 1259 OID 17070)
-- Name: transactions_2026_08_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_08_goal_id_idx ON public.transactions_2026_08 USING btree (goal_id);


--
-- TOC entry 5468 (class 1259 OID 17071)
-- Name: transactions_2026_08_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_08_user_id_idx ON public.transactions_2026_08 USING btree (user_id);


--
-- TOC entry 5469 (class 1259 OID 17072)
-- Name: transactions_2026_09_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_09_family_id_date_idx ON public.transactions_2026_09 USING btree (family_id, date DESC);


--
-- TOC entry 5470 (class 1259 OID 17073)
-- Name: transactions_2026_09_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_09_goal_id_idx ON public.transactions_2026_09 USING btree (goal_id);


--
-- TOC entry 5473 (class 1259 OID 17074)
-- Name: transactions_2026_09_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_09_user_id_idx ON public.transactions_2026_09 USING btree (user_id);


--
-- TOC entry 5474 (class 1259 OID 17075)
-- Name: transactions_2026_10_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_10_family_id_date_idx ON public.transactions_2026_10 USING btree (family_id, date DESC);


--
-- TOC entry 5475 (class 1259 OID 17076)
-- Name: transactions_2026_10_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_10_goal_id_idx ON public.transactions_2026_10 USING btree (goal_id);


--
-- TOC entry 5478 (class 1259 OID 17077)
-- Name: transactions_2026_10_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_10_user_id_idx ON public.transactions_2026_10 USING btree (user_id);


--
-- TOC entry 5479 (class 1259 OID 17078)
-- Name: transactions_2026_11_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_11_family_id_date_idx ON public.transactions_2026_11 USING btree (family_id, date DESC);


--
-- TOC entry 5480 (class 1259 OID 17079)
-- Name: transactions_2026_11_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_11_goal_id_idx ON public.transactions_2026_11 USING btree (goal_id);


--
-- TOC entry 5483 (class 1259 OID 17080)
-- Name: transactions_2026_11_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_11_user_id_idx ON public.transactions_2026_11 USING btree (user_id);


--
-- TOC entry 5484 (class 1259 OID 17081)
-- Name: transactions_2026_12_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_12_family_id_date_idx ON public.transactions_2026_12 USING btree (family_id, date DESC);


--
-- TOC entry 5485 (class 1259 OID 17082)
-- Name: transactions_2026_12_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_12_goal_id_idx ON public.transactions_2026_12 USING btree (goal_id);


--
-- TOC entry 5488 (class 1259 OID 17083)
-- Name: transactions_2026_12_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2026_12_user_id_idx ON public.transactions_2026_12 USING btree (user_id);


--
-- TOC entry 5489 (class 1259 OID 17084)
-- Name: transactions_2027_01_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_01_family_id_date_idx ON public.transactions_2027_01 USING btree (family_id, date DESC);


--
-- TOC entry 5490 (class 1259 OID 17085)
-- Name: transactions_2027_01_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_01_goal_id_idx ON public.transactions_2027_01 USING btree (goal_id);


--
-- TOC entry 5493 (class 1259 OID 17086)
-- Name: transactions_2027_01_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_01_user_id_idx ON public.transactions_2027_01 USING btree (user_id);


--
-- TOC entry 5494 (class 1259 OID 17087)
-- Name: transactions_2027_02_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_02_family_id_date_idx ON public.transactions_2027_02 USING btree (family_id, date DESC);


--
-- TOC entry 5495 (class 1259 OID 17088)
-- Name: transactions_2027_02_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_02_goal_id_idx ON public.transactions_2027_02 USING btree (goal_id);


--
-- TOC entry 5498 (class 1259 OID 17089)
-- Name: transactions_2027_02_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_02_user_id_idx ON public.transactions_2027_02 USING btree (user_id);


--
-- TOC entry 5499 (class 1259 OID 17090)
-- Name: transactions_2027_03_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_03_family_id_date_idx ON public.transactions_2027_03 USING btree (family_id, date DESC);


--
-- TOC entry 5500 (class 1259 OID 17091)
-- Name: transactions_2027_03_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_03_goal_id_idx ON public.transactions_2027_03 USING btree (goal_id);


--
-- TOC entry 5503 (class 1259 OID 17092)
-- Name: transactions_2027_03_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_03_user_id_idx ON public.transactions_2027_03 USING btree (user_id);


--
-- TOC entry 5645 (class 1259 OID 25964)
-- Name: transactions_2027_04_family_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_04_family_id_date_idx ON public.transactions_2027_04 USING btree (family_id, date DESC);


--
-- TOC entry 5646 (class 1259 OID 25965)
-- Name: transactions_2027_04_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_04_goal_id_idx ON public.transactions_2027_04 USING btree (goal_id);


--
-- TOC entry 5649 (class 1259 OID 25966)
-- Name: transactions_2027_04_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_2027_04_user_id_idx ON public.transactions_2027_04 USING btree (user_id);


--
-- TOC entry 5721 (class 0 OID 0)
-- Name: transactions_2024_01_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_01_family_id_date_idx;


--
-- TOC entry 5722 (class 0 OID 0)
-- Name: transactions_2024_01_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_01_goal_id_idx;


--
-- TOC entry 5723 (class 0 OID 0)
-- Name: transactions_2024_01_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_01_pkey;


--
-- TOC entry 5724 (class 0 OID 0)
-- Name: transactions_2024_01_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_01_user_id_idx;


--
-- TOC entry 5725 (class 0 OID 0)
-- Name: transactions_2024_02_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_02_family_id_date_idx;


--
-- TOC entry 5726 (class 0 OID 0)
-- Name: transactions_2024_02_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_02_goal_id_idx;


--
-- TOC entry 5727 (class 0 OID 0)
-- Name: transactions_2024_02_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_02_pkey;


--
-- TOC entry 5728 (class 0 OID 0)
-- Name: transactions_2024_02_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_02_user_id_idx;


--
-- TOC entry 5729 (class 0 OID 0)
-- Name: transactions_2024_03_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_03_family_id_date_idx;


--
-- TOC entry 5730 (class 0 OID 0)
-- Name: transactions_2024_03_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_03_goal_id_idx;


--
-- TOC entry 5731 (class 0 OID 0)
-- Name: transactions_2024_03_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_03_pkey;


--
-- TOC entry 5732 (class 0 OID 0)
-- Name: transactions_2024_03_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_03_user_id_idx;


--
-- TOC entry 5733 (class 0 OID 0)
-- Name: transactions_2024_04_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_04_family_id_date_idx;


--
-- TOC entry 5734 (class 0 OID 0)
-- Name: transactions_2024_04_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_04_goal_id_idx;


--
-- TOC entry 5735 (class 0 OID 0)
-- Name: transactions_2024_04_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_04_pkey;


--
-- TOC entry 5736 (class 0 OID 0)
-- Name: transactions_2024_04_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_04_user_id_idx;


--
-- TOC entry 5737 (class 0 OID 0)
-- Name: transactions_2024_05_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_05_family_id_date_idx;


--
-- TOC entry 5738 (class 0 OID 0)
-- Name: transactions_2024_05_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_05_goal_id_idx;


--
-- TOC entry 5739 (class 0 OID 0)
-- Name: transactions_2024_05_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_05_pkey;


--
-- TOC entry 5740 (class 0 OID 0)
-- Name: transactions_2024_05_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_05_user_id_idx;


--
-- TOC entry 5741 (class 0 OID 0)
-- Name: transactions_2024_06_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_06_family_id_date_idx;


--
-- TOC entry 5742 (class 0 OID 0)
-- Name: transactions_2024_06_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_06_goal_id_idx;


--
-- TOC entry 5743 (class 0 OID 0)
-- Name: transactions_2024_06_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_06_pkey;


--
-- TOC entry 5744 (class 0 OID 0)
-- Name: transactions_2024_06_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_06_user_id_idx;


--
-- TOC entry 5745 (class 0 OID 0)
-- Name: transactions_2024_07_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_07_family_id_date_idx;


--
-- TOC entry 5746 (class 0 OID 0)
-- Name: transactions_2024_07_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_07_goal_id_idx;


--
-- TOC entry 5747 (class 0 OID 0)
-- Name: transactions_2024_07_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_07_pkey;


--
-- TOC entry 5748 (class 0 OID 0)
-- Name: transactions_2024_07_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_07_user_id_idx;


--
-- TOC entry 5749 (class 0 OID 0)
-- Name: transactions_2024_08_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_08_family_id_date_idx;


--
-- TOC entry 5750 (class 0 OID 0)
-- Name: transactions_2024_08_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_08_goal_id_idx;


--
-- TOC entry 5751 (class 0 OID 0)
-- Name: transactions_2024_08_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_08_pkey;


--
-- TOC entry 5752 (class 0 OID 0)
-- Name: transactions_2024_08_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_08_user_id_idx;


--
-- TOC entry 5753 (class 0 OID 0)
-- Name: transactions_2024_09_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_09_family_id_date_idx;


--
-- TOC entry 5754 (class 0 OID 0)
-- Name: transactions_2024_09_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_09_goal_id_idx;


--
-- TOC entry 5755 (class 0 OID 0)
-- Name: transactions_2024_09_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_09_pkey;


--
-- TOC entry 5756 (class 0 OID 0)
-- Name: transactions_2024_09_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_09_user_id_idx;


--
-- TOC entry 5757 (class 0 OID 0)
-- Name: transactions_2024_10_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_10_family_id_date_idx;


--
-- TOC entry 5758 (class 0 OID 0)
-- Name: transactions_2024_10_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_10_goal_id_idx;


--
-- TOC entry 5759 (class 0 OID 0)
-- Name: transactions_2024_10_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_10_pkey;


--
-- TOC entry 5760 (class 0 OID 0)
-- Name: transactions_2024_10_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_10_user_id_idx;


--
-- TOC entry 5761 (class 0 OID 0)
-- Name: transactions_2024_11_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_11_family_id_date_idx;


--
-- TOC entry 5762 (class 0 OID 0)
-- Name: transactions_2024_11_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_11_goal_id_idx;


--
-- TOC entry 5763 (class 0 OID 0)
-- Name: transactions_2024_11_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_11_pkey;


--
-- TOC entry 5764 (class 0 OID 0)
-- Name: transactions_2024_11_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_11_user_id_idx;


--
-- TOC entry 5765 (class 0 OID 0)
-- Name: transactions_2024_12_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2024_12_family_id_date_idx;


--
-- TOC entry 5766 (class 0 OID 0)
-- Name: transactions_2024_12_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2024_12_goal_id_idx;


--
-- TOC entry 5767 (class 0 OID 0)
-- Name: transactions_2024_12_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2024_12_pkey;


--
-- TOC entry 5768 (class 0 OID 0)
-- Name: transactions_2024_12_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2024_12_user_id_idx;


--
-- TOC entry 5769 (class 0 OID 0)
-- Name: transactions_2025_01_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_01_family_id_date_idx;


--
-- TOC entry 5770 (class 0 OID 0)
-- Name: transactions_2025_01_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_01_goal_id_idx;


--
-- TOC entry 5771 (class 0 OID 0)
-- Name: transactions_2025_01_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_01_pkey;


--
-- TOC entry 5772 (class 0 OID 0)
-- Name: transactions_2025_01_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_01_user_id_idx;


--
-- TOC entry 5773 (class 0 OID 0)
-- Name: transactions_2025_02_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_02_family_id_date_idx;


--
-- TOC entry 5774 (class 0 OID 0)
-- Name: transactions_2025_02_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_02_goal_id_idx;


--
-- TOC entry 5775 (class 0 OID 0)
-- Name: transactions_2025_02_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_02_pkey;


--
-- TOC entry 5776 (class 0 OID 0)
-- Name: transactions_2025_02_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_02_user_id_idx;


--
-- TOC entry 5777 (class 0 OID 0)
-- Name: transactions_2025_03_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_03_family_id_date_idx;


--
-- TOC entry 5778 (class 0 OID 0)
-- Name: transactions_2025_03_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_03_goal_id_idx;


--
-- TOC entry 5779 (class 0 OID 0)
-- Name: transactions_2025_03_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_03_pkey;


--
-- TOC entry 5780 (class 0 OID 0)
-- Name: transactions_2025_03_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_03_user_id_idx;


--
-- TOC entry 5781 (class 0 OID 0)
-- Name: transactions_2025_04_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_04_family_id_date_idx;


--
-- TOC entry 5782 (class 0 OID 0)
-- Name: transactions_2025_04_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_04_goal_id_idx;


--
-- TOC entry 5783 (class 0 OID 0)
-- Name: transactions_2025_04_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_04_pkey;


--
-- TOC entry 5784 (class 0 OID 0)
-- Name: transactions_2025_04_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_04_user_id_idx;


--
-- TOC entry 5785 (class 0 OID 0)
-- Name: transactions_2025_05_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_05_family_id_date_idx;


--
-- TOC entry 5786 (class 0 OID 0)
-- Name: transactions_2025_05_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_05_goal_id_idx;


--
-- TOC entry 5787 (class 0 OID 0)
-- Name: transactions_2025_05_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_05_pkey;


--
-- TOC entry 5788 (class 0 OID 0)
-- Name: transactions_2025_05_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_05_user_id_idx;


--
-- TOC entry 5789 (class 0 OID 0)
-- Name: transactions_2025_06_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_06_family_id_date_idx;


--
-- TOC entry 5790 (class 0 OID 0)
-- Name: transactions_2025_06_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_06_goal_id_idx;


--
-- TOC entry 5791 (class 0 OID 0)
-- Name: transactions_2025_06_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_06_pkey;


--
-- TOC entry 5792 (class 0 OID 0)
-- Name: transactions_2025_06_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_06_user_id_idx;


--
-- TOC entry 5793 (class 0 OID 0)
-- Name: transactions_2025_07_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_07_family_id_date_idx;


--
-- TOC entry 5794 (class 0 OID 0)
-- Name: transactions_2025_07_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_07_goal_id_idx;


--
-- TOC entry 5795 (class 0 OID 0)
-- Name: transactions_2025_07_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_07_pkey;


--
-- TOC entry 5796 (class 0 OID 0)
-- Name: transactions_2025_07_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_07_user_id_idx;


--
-- TOC entry 5797 (class 0 OID 0)
-- Name: transactions_2025_08_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_08_family_id_date_idx;


--
-- TOC entry 5798 (class 0 OID 0)
-- Name: transactions_2025_08_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_08_goal_id_idx;


--
-- TOC entry 5799 (class 0 OID 0)
-- Name: transactions_2025_08_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_08_pkey;


--
-- TOC entry 5800 (class 0 OID 0)
-- Name: transactions_2025_08_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_08_user_id_idx;


--
-- TOC entry 5801 (class 0 OID 0)
-- Name: transactions_2025_09_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_09_family_id_date_idx;


--
-- TOC entry 5802 (class 0 OID 0)
-- Name: transactions_2025_09_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_09_goal_id_idx;


--
-- TOC entry 5803 (class 0 OID 0)
-- Name: transactions_2025_09_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_09_pkey;


--
-- TOC entry 5804 (class 0 OID 0)
-- Name: transactions_2025_09_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_09_user_id_idx;


--
-- TOC entry 5805 (class 0 OID 0)
-- Name: transactions_2025_10_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_10_family_id_date_idx;


--
-- TOC entry 5806 (class 0 OID 0)
-- Name: transactions_2025_10_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_10_goal_id_idx;


--
-- TOC entry 5807 (class 0 OID 0)
-- Name: transactions_2025_10_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_10_pkey;


--
-- TOC entry 5808 (class 0 OID 0)
-- Name: transactions_2025_10_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_10_user_id_idx;


--
-- TOC entry 5809 (class 0 OID 0)
-- Name: transactions_2025_11_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_11_family_id_date_idx;


--
-- TOC entry 5810 (class 0 OID 0)
-- Name: transactions_2025_11_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_11_goal_id_idx;


--
-- TOC entry 5811 (class 0 OID 0)
-- Name: transactions_2025_11_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_11_pkey;


--
-- TOC entry 5812 (class 0 OID 0)
-- Name: transactions_2025_11_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_11_user_id_idx;


--
-- TOC entry 5813 (class 0 OID 0)
-- Name: transactions_2025_12_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2025_12_family_id_date_idx;


--
-- TOC entry 5814 (class 0 OID 0)
-- Name: transactions_2025_12_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2025_12_goal_id_idx;


--
-- TOC entry 5815 (class 0 OID 0)
-- Name: transactions_2025_12_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2025_12_pkey;


--
-- TOC entry 5816 (class 0 OID 0)
-- Name: transactions_2025_12_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2025_12_user_id_idx;


--
-- TOC entry 5661 (class 0 OID 0)
-- Name: transactions_2026_01_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_01_family_id_date_idx;


--
-- TOC entry 5662 (class 0 OID 0)
-- Name: transactions_2026_01_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_01_goal_id_idx;


--
-- TOC entry 5663 (class 0 OID 0)
-- Name: transactions_2026_01_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_01_pkey;


--
-- TOC entry 5664 (class 0 OID 0)
-- Name: transactions_2026_01_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_01_user_id_idx;


--
-- TOC entry 5665 (class 0 OID 0)
-- Name: transactions_2026_02_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_02_family_id_date_idx;


--
-- TOC entry 5666 (class 0 OID 0)
-- Name: transactions_2026_02_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_02_goal_id_idx;


--
-- TOC entry 5667 (class 0 OID 0)
-- Name: transactions_2026_02_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_02_pkey;


--
-- TOC entry 5668 (class 0 OID 0)
-- Name: transactions_2026_02_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_02_user_id_idx;


--
-- TOC entry 5669 (class 0 OID 0)
-- Name: transactions_2026_03_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_03_family_id_date_idx;


--
-- TOC entry 5670 (class 0 OID 0)
-- Name: transactions_2026_03_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_03_goal_id_idx;


--
-- TOC entry 5671 (class 0 OID 0)
-- Name: transactions_2026_03_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_03_pkey;


--
-- TOC entry 5672 (class 0 OID 0)
-- Name: transactions_2026_03_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_03_user_id_idx;


--
-- TOC entry 5673 (class 0 OID 0)
-- Name: transactions_2026_04_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_04_family_id_date_idx;


--
-- TOC entry 5674 (class 0 OID 0)
-- Name: transactions_2026_04_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_04_goal_id_idx;


--
-- TOC entry 5675 (class 0 OID 0)
-- Name: transactions_2026_04_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_04_pkey;


--
-- TOC entry 5676 (class 0 OID 0)
-- Name: transactions_2026_04_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_04_user_id_idx;


--
-- TOC entry 5677 (class 0 OID 0)
-- Name: transactions_2026_05_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_05_family_id_date_idx;


--
-- TOC entry 5678 (class 0 OID 0)
-- Name: transactions_2026_05_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_05_goal_id_idx;


--
-- TOC entry 5679 (class 0 OID 0)
-- Name: transactions_2026_05_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_05_pkey;


--
-- TOC entry 5680 (class 0 OID 0)
-- Name: transactions_2026_05_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_05_user_id_idx;


--
-- TOC entry 5681 (class 0 OID 0)
-- Name: transactions_2026_06_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_06_family_id_date_idx;


--
-- TOC entry 5682 (class 0 OID 0)
-- Name: transactions_2026_06_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_06_goal_id_idx;


--
-- TOC entry 5683 (class 0 OID 0)
-- Name: transactions_2026_06_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_06_pkey;


--
-- TOC entry 5684 (class 0 OID 0)
-- Name: transactions_2026_06_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_06_user_id_idx;


--
-- TOC entry 5685 (class 0 OID 0)
-- Name: transactions_2026_07_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_07_family_id_date_idx;


--
-- TOC entry 5686 (class 0 OID 0)
-- Name: transactions_2026_07_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_07_goal_id_idx;


--
-- TOC entry 5687 (class 0 OID 0)
-- Name: transactions_2026_07_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_07_pkey;


--
-- TOC entry 5688 (class 0 OID 0)
-- Name: transactions_2026_07_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_07_user_id_idx;


--
-- TOC entry 5689 (class 0 OID 0)
-- Name: transactions_2026_08_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_08_family_id_date_idx;


--
-- TOC entry 5690 (class 0 OID 0)
-- Name: transactions_2026_08_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_08_goal_id_idx;


--
-- TOC entry 5691 (class 0 OID 0)
-- Name: transactions_2026_08_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_08_pkey;


--
-- TOC entry 5692 (class 0 OID 0)
-- Name: transactions_2026_08_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_08_user_id_idx;


--
-- TOC entry 5693 (class 0 OID 0)
-- Name: transactions_2026_09_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_09_family_id_date_idx;


--
-- TOC entry 5694 (class 0 OID 0)
-- Name: transactions_2026_09_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_09_goal_id_idx;


--
-- TOC entry 5695 (class 0 OID 0)
-- Name: transactions_2026_09_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_09_pkey;


--
-- TOC entry 5696 (class 0 OID 0)
-- Name: transactions_2026_09_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_09_user_id_idx;


--
-- TOC entry 5697 (class 0 OID 0)
-- Name: transactions_2026_10_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_10_family_id_date_idx;


--
-- TOC entry 5698 (class 0 OID 0)
-- Name: transactions_2026_10_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_10_goal_id_idx;


--
-- TOC entry 5699 (class 0 OID 0)
-- Name: transactions_2026_10_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_10_pkey;


--
-- TOC entry 5700 (class 0 OID 0)
-- Name: transactions_2026_10_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_10_user_id_idx;


--
-- TOC entry 5701 (class 0 OID 0)
-- Name: transactions_2026_11_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_11_family_id_date_idx;


--
-- TOC entry 5702 (class 0 OID 0)
-- Name: transactions_2026_11_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_11_goal_id_idx;


--
-- TOC entry 5703 (class 0 OID 0)
-- Name: transactions_2026_11_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_11_pkey;


--
-- TOC entry 5704 (class 0 OID 0)
-- Name: transactions_2026_11_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_11_user_id_idx;


--
-- TOC entry 5705 (class 0 OID 0)
-- Name: transactions_2026_12_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2026_12_family_id_date_idx;


--
-- TOC entry 5706 (class 0 OID 0)
-- Name: transactions_2026_12_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2026_12_goal_id_idx;


--
-- TOC entry 5707 (class 0 OID 0)
-- Name: transactions_2026_12_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2026_12_pkey;


--
-- TOC entry 5708 (class 0 OID 0)
-- Name: transactions_2026_12_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2026_12_user_id_idx;


--
-- TOC entry 5709 (class 0 OID 0)
-- Name: transactions_2027_01_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2027_01_family_id_date_idx;


--
-- TOC entry 5710 (class 0 OID 0)
-- Name: transactions_2027_01_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2027_01_goal_id_idx;


--
-- TOC entry 5711 (class 0 OID 0)
-- Name: transactions_2027_01_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2027_01_pkey;


--
-- TOC entry 5712 (class 0 OID 0)
-- Name: transactions_2027_01_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2027_01_user_id_idx;


--
-- TOC entry 5713 (class 0 OID 0)
-- Name: transactions_2027_02_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2027_02_family_id_date_idx;


--
-- TOC entry 5714 (class 0 OID 0)
-- Name: transactions_2027_02_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2027_02_goal_id_idx;


--
-- TOC entry 5715 (class 0 OID 0)
-- Name: transactions_2027_02_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2027_02_pkey;


--
-- TOC entry 5716 (class 0 OID 0)
-- Name: transactions_2027_02_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2027_02_user_id_idx;


--
-- TOC entry 5717 (class 0 OID 0)
-- Name: transactions_2027_03_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2027_03_family_id_date_idx;


--
-- TOC entry 5718 (class 0 OID 0)
-- Name: transactions_2027_03_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2027_03_goal_id_idx;


--
-- TOC entry 5719 (class 0 OID 0)
-- Name: transactions_2027_03_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2027_03_pkey;


--
-- TOC entry 5720 (class 0 OID 0)
-- Name: transactions_2027_03_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2027_03_user_id_idx;


--
-- TOC entry 5817 (class 0 OID 0)
-- Name: transactions_2027_04_family_id_date_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_family_date ATTACH PARTITION public.transactions_2027_04_family_id_date_idx;


--
-- TOC entry 5818 (class 0 OID 0)
-- Name: transactions_2027_04_goal_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_goal_id ATTACH PARTITION public.transactions_2027_04_goal_id_idx;


--
-- TOC entry 5819 (class 0 OID 0)
-- Name: transactions_2027_04_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.transactions_pkey1 ATTACH PARTITION public.transactions_2027_04_pkey;


--
-- TOC entry 5820 (class 0 OID 0)
-- Name: transactions_2027_04_user_id_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.idx_transactions_user_id ATTACH PARTITION public.transactions_2027_04_user_id_idx;


--
-- TOC entry 5821 (class 2606 OID 25388)
-- Name: assets fk_assets_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fk_assets_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5822 (class 2606 OID 17093)
-- Name: blog_posts fk_blog_posts_author; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT fk_blog_posts_author FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- TOC entry 5823 (class 2606 OID 17098)
-- Name: blog_posts fk_blog_posts_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT fk_blog_posts_category FOREIGN KEY (category_id) REFERENCES public.blog_categories(id);


--
-- TOC entry 5830 (class 2606 OID 17103)
-- Name: savings fk_budget_categories_items; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings
    ADD CONSTRAINT fk_budget_categories_items FOREIGN KEY (budget_category_id) REFERENCES public.budget_categories(id);


--
-- TOC entry 5824 (class 2606 OID 17213)
-- Name: budget_categories fk_budget_categories_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT fk_budget_categories_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5825 (class 2606 OID 17208)
-- Name: debt_payments fk_debt_payments_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT fk_debt_payments_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5827 (class 2606 OID 17108)
-- Name: family_members fk_families_members; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT fk_families_members FOREIGN KEY (family_id) REFERENCES public.families(id);


--
-- TOC entry 5826 (class 2606 OID 17113)
-- Name: family_challenges fk_family_challenges_family; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_challenges
    ADD CONSTRAINT fk_family_challenges_family FOREIGN KEY (family_id) REFERENCES public.families(id);


--
-- TOC entry 5829 (class 2606 OID 17118)
-- Name: payment_transactions fk_payment_transactions_family; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT fk_payment_transactions_family FOREIGN KEY (family_id) REFERENCES public.families(id);


--
-- TOC entry 5831 (class 2606 OID 17225)
-- Name: savings fk_savings_target_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings
    ADD CONSTRAINT fk_savings_target_user FOREIGN KEY (target_user_id) REFERENCES public.users(id);


--
-- TOC entry 5832 (class 2606 OID 17219)
-- Name: savings fk_savings_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings
    ADD CONSTRAINT fk_savings_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5833 (class 2606 OID 17123)
-- Name: support_reports fk_support_reports_family; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_reports
    ADD CONSTRAINT fk_support_reports_family FOREIGN KEY (family_id) REFERENCES public.families(id);


--
-- TOC entry 5834 (class 2606 OID 17128)
-- Name: support_reports fk_support_reports_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_reports
    ADD CONSTRAINT fk_support_reports_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5835 (class 2606 OID 17133)
-- Name: transactions fk_transactions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.transactions
    ADD CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5828 (class 2606 OID 17183)
-- Name: family_members fk_users_family_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT fk_users_family_member FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5836 (class 2606 OID 17199)
-- Name: wallets fk_wallets_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2026-04-06 12:30:40

--
-- PostgreSQL database dump complete
--

\unrestrict HSYaSlGHrsyBjUJg8wzAGRiRPMTOC7meYoAl5eam3T7CUkssCni16KrKAkz9lQY

