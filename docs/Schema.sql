--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-09-14 23:13:03

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
-- TOC entry 2 (class 3079 OID 16904)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 250 (class 1255 OID 17243)
-- Name: get_product_lowest_price(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_product_lowest_price(product_uuid uuid) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    lowest_price NUMERIC(10,2);
BEGIN
    SELECT MIN(price) INTO lowest_price
    FROM store_links 
    WHERE product_id = product_uuid AND price > 0;
    
    IF lowest_price IS NULL THEN
        SELECT price INTO lowest_price
        FROM products
        WHERE id = product_uuid;
    END IF;
    
    RETURN COALESCE(lowest_price, 0);
END;
$$;


ALTER FUNCTION public.get_product_lowest_price(product_uuid uuid) OWNER TO postgres;

--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 250
-- Name: FUNCTION get_product_lowest_price(product_uuid uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_product_lowest_price(product_uuid uuid) IS 'Get the lowest price for a product from store_links, fallback to product.price';


--
-- TOC entry 249 (class 1255 OID 17231)
-- Name: update_product_price(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_product_price() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update product price to lowest store_links price for the affected product
    UPDATE products 
    SET price = (
        SELECT MIN(price) 
        FROM store_links 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND price IS NOT NULL
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_product_price() OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 17170)
-- Name: update_product_rating(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_product_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE products 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0) 
                FROM reviews 
                WHERE product_id = NEW.product_id AND status = 'published'
            ),
            review_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE product_id = NEW.product_id AND status = 'published'
            )
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0) 
                FROM reviews 
                WHERE product_id = OLD.product_id AND status = 'published'
            ),
            review_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE product_id = OLD.product_id AND status = 'published'
            )
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_product_rating() OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 17172)
-- Name: update_review_helpful_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_review_helpful_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews 
        SET helpful_count = helpful_count + 1
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews 
        SET helpful_count = helpful_count - 1
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_review_helpful_count() OWNER TO postgres;

--
-- TOC entry 248 (class 1255 OID 17230)
-- Name: validate_password_strength(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_password_strength(password_text text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check minimum length (8 characters)
    IF LENGTH(password_text) < 8 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for at least one uppercase letter
    IF password_text !~ '[A-Z]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for at least one lowercase letter  
    IF password_text !~ '[a-z]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for at least one digit
    IF password_text !~ '[0-9]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for at least one special character
    IF password_text !~ '[^A-Za-z0-9]' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.validate_password_strength(password_text text) OWNER TO postgres;

--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 248
-- Name: FUNCTION validate_password_strength(password_text text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validate_password_strength(password_text text) IS 'Validates password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16929)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17130)
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    status character varying(20) DEFAULT 'unread'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['unread'::character varying, 'read'::character varying, 'replied'::character varying])::text[])))
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16977)
-- Name: product_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_features (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    feature_text character varying(500) NOT NULL,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.product_features OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16961)
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16991)
-- Name: product_specifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_specifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    spec_name character varying(100) NOT NULL,
    spec_value character varying(500) NOT NULL
);


ALTER TABLE public.product_specifications OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16942)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category_id uuid,
    manufacturer character varying(255),
    price numeric(10,2),
    product_url character varying(500),
    availability character varying(100),
    average_rating numeric(3,2) DEFAULT 0.0,
    review_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN products.price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.price IS 'Current price - automatically updated to the lowest price from store_links';


--
-- TOC entry 236 (class 1259 OID 17238)
-- Name: products_with_image; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.products_with_image AS
 SELECT p.id,
    p.name,
    p.description,
    p.category_id,
    p.manufacturer,
    p.price,
    p.product_url,
    p.availability,
    p.average_rating,
    p.review_count,
    p.status,
    p.created_at,
    p.updated_at,
    pi.image_url AS first_image_url,
    pi.is_primary,
        CASE
            WHEN (pi.image_url IS NOT NULL) THEN pi.image_url
            ELSE NULL::character varying
        END AS display_image
   FROM (public.products p
     LEFT JOIN ( SELECT DISTINCT ON (product_images.product_id) product_images.product_id,
            product_images.image_url,
            product_images.is_primary,
            product_images.created_at
           FROM public.product_images
          ORDER BY product_images.product_id, product_images.is_primary DESC, product_images.created_at) pi ON ((p.id = pi.product_id)));


ALTER VIEW public.products_with_image OWNER TO postgres;

--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 236
-- Name: VIEW products_with_image; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.products_with_image IS 'Products with their first/primary image from product_images table. Use display_image for frontend display.';


--
-- TOC entry 226 (class 1259 OID 17004)
-- Name: store_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store_links (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    store_name character varying(100) NOT NULL,
    price numeric(10,2),
    url character varying(500) NOT NULL,
    is_official boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.store_links OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17244)
-- Name: products_with_pricing; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.products_with_pricing AS
 SELECT id,
    name,
    description,
    category_id,
    manufacturer,
    price,
    product_url,
    availability,
    average_rating,
    review_count,
    status,
    created_at,
    updated_at,
    public.get_product_lowest_price(id) AS lowest_price,
    ( SELECT count(*) AS count
           FROM public.store_links sl
          WHERE (sl.product_id = p.id)) AS store_count
   FROM public.products p;


ALTER VIEW public.products_with_pricing OWNER TO postgres;

--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 237
-- Name: VIEW products_with_pricing; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.products_with_pricing IS 'Products with calculated lowest price from store_links';


--
-- TOC entry 235 (class 1259 OID 17175)
-- Name: review_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    parent_id uuid,
    content text NOT NULL,
    status character varying(20) DEFAULT 'visible'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_comments_status_check CHECK (((status)::text = ANY ((ARRAY['visible'::character varying, 'hidden'::character varying, 'deleted'::character varying])::text[])))
);


ALTER TABLE public.review_comments OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17059)
-- Name: review_cons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_cons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid,
    con_text character varying(500) NOT NULL,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.review_cons OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17089)
-- Name: review_helpful_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_helpful_votes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid,
    user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.review_helpful_votes OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17073)
-- Name: review_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_media (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid,
    media_url character varying(500) NOT NULL,
    media_type character varying(20),
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_media_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[])))
);


ALTER TABLE public.review_media OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17045)
-- Name: review_pros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_pros (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid,
    pro_text character varying(500) NOT NULL,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.review_pros OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17108)
-- Name: review_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    product_name character varying(255) NOT NULL,
    manufacturer character varying(255),
    category_id uuid,
    product_url character varying(500),
    price numeric(10,2),
    availability character varying(100),
    description text,
    reasoning text,
    contact_email character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.review_requests OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17019)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    product_id uuid,
    rating integer,
    title character varying(255),
    content text,
    status character varying(20) DEFAULT 'pending'::character varying,
    helpful_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'published'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17141)
-- Name: user_follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_follows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    follower_id uuid,
    followed_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_follows OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16915)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    avatar character varying(500),
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email_verified boolean DEFAULT false,
    verification_token character varying(255),
    verification_token_expires timestamp without time zone,
    verification_sent_at timestamp without time zone,
    CONSTRAINT password_hash_not_empty CHECK ((length((password_hash)::text) > 0)),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY['user'::text, 'admin'::text, 'reviewer'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password_hash IS 'Hashed password. Original password must meet requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character';


--
-- TOC entry 4845 (class 2606 OID 16939)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 4847 (class 2606 OID 16937)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 16941)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 4889 (class 2606 OID 17140)
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 16985)
-- Name: product_features product_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_features
    ADD CONSTRAINT product_features_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 16971)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 16998)
-- Name: product_specifications product_specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_specifications
    ADD CONSTRAINT product_specifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4855 (class 2606 OID 16955)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 17186)
-- Name: review_comments review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 17067)
-- Name: review_cons review_cons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_cons
    ADD CONSTRAINT review_cons_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 17095)
-- Name: review_helpful_votes review_helpful_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 17097)
-- Name: review_helpful_votes review_helpful_votes_review_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_user_id_key UNIQUE (review_id, user_id);


--
-- TOC entry 4880 (class 2606 OID 17083)
-- Name: review_media review_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 17053)
-- Name: review_pros review_pros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_pros
    ADD CONSTRAINT review_pros_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 17119)
-- Name: review_requests review_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 17032)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 17034)
-- Name: reviews reviews_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- TOC entry 4865 (class 2606 OID 17013)
-- Name: store_links store_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_links
    ADD CONSTRAINT store_links_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 17149)
-- Name: user_follows user_follows_follower_id_followed_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_followed_id_key UNIQUE (follower_id, followed_id);


--
-- TOC entry 4893 (class 2606 OID 17147)
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (id);


--
-- TOC entry 4841 (class 2606 OID 16928)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4843 (class 2606 OID 16926)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 1259 OID 17169)
-- Name: idx_product_images_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--
-- TOC entry 4850 (class 1259 OID 17161)
-- Name: idx_products_avg_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_avg_rating ON public.products USING btree (average_rating DESC);


--
-- TOC entry 4851 (class 1259 OID 17160)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- TOC entry 4852 (class 1259 OID 17163)
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC);


--
-- TOC entry 4853 (class 1259 OID 17162)
-- Name: idx_products_review_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_review_count ON public.products USING btree (review_count DESC);


--
-- TOC entry 4894 (class 1259 OID 17204)
-- Name: idx_review_comments_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_created ON public.review_comments USING btree (created_at DESC);


--
-- TOC entry 4895 (class 1259 OID 17203)
-- Name: idx_review_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_parent ON public.review_comments USING btree (parent_id);


--
-- TOC entry 4896 (class 1259 OID 17202)
-- Name: idx_review_comments_review; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_review ON public.review_comments USING btree (review_id);


--
-- TOC entry 4881 (class 1259 OID 17168)
-- Name: idx_review_helpful_votes_review; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_helpful_votes_review ON public.review_helpful_votes USING btree (review_id);


--
-- TOC entry 4867 (class 1259 OID 17167)
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);


--
-- TOC entry 4868 (class 1259 OID 17164)
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- TOC entry 4869 (class 1259 OID 17166)
-- Name: idx_reviews_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_status ON public.reviews USING btree (status);


--
-- TOC entry 4870 (class 1259 OID 17165)
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- TOC entry 4863 (class 1259 OID 17233)
-- Name: idx_store_links_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_links_price ON public.store_links USING btree (product_id, price) WHERE (price IS NOT NULL);


--
-- TOC entry 4839 (class 1259 OID 17228)
-- Name: idx_users_verification_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_verification_token ON public.users USING btree (verification_token);


--
-- TOC entry 4866 (class 1259 OID 17212)
-- Name: uniq_store_links_product_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_store_links_product_url ON public.store_links USING btree (product_id, url);


--
-- TOC entry 4918 (class 2620 OID 17232)
-- Name: store_links trigger_update_product_price; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_product_price AFTER INSERT OR DELETE OR UPDATE ON public.store_links FOR EACH ROW EXECUTE FUNCTION public.update_product_price();


--
-- TOC entry 4919 (class 2620 OID 17171)
-- Name: reviews trigger_update_product_rating; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_product_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();


--
-- TOC entry 4920 (class 2620 OID 17173)
-- Name: review_helpful_votes trigger_update_review_helpful_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_review_helpful_count AFTER INSERT OR DELETE ON public.review_helpful_votes FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();


--
-- TOC entry 4901 (class 2606 OID 16986)
-- Name: product_features product_features_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_features
    ADD CONSTRAINT product_features_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4900 (class 2606 OID 16972)
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4902 (class 2606 OID 16999)
-- Name: product_specifications product_specifications_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_specifications
    ADD CONSTRAINT product_specifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 16956)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4915 (class 2606 OID 17197)
-- Name: review_comments review_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- TOC entry 4916 (class 2606 OID 17187)
-- Name: review_comments review_comments_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 17192)
-- Name: review_comments review_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4907 (class 2606 OID 17068)
-- Name: review_cons review_cons_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_cons
    ADD CONSTRAINT review_cons_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 17098)
-- Name: review_helpful_votes review_helpful_votes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 17103)
-- Name: review_helpful_votes review_helpful_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4908 (class 2606 OID 17084)
-- Name: review_media review_media_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- TOC entry 4906 (class 2606 OID 17054)
-- Name: review_pros review_pros_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_pros
    ADD CONSTRAINT review_pros_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 17125)
-- Name: review_requests review_requests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4912 (class 2606 OID 17120)
-- Name: review_requests review_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4904 (class 2606 OID 17040)
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4905 (class 2606 OID 17035)
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4903 (class 2606 OID 17014)
-- Name: store_links store_links_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_links
    ADD CONSTRAINT store_links_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 17155)
-- Name: user_follows user_follows_followed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_followed_id_fkey FOREIGN KEY (followed_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4914 (class 2606 OID 17150)
-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-09-14 23:13:04

--
-- PostgreSQL database dump complete
--

