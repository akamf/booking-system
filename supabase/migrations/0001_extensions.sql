-- Required Postgres extensions.
--
-- btree_gist enables the GiST exclusion constraint that makes
-- double-booking impossible on the `bookings` table (see ADR-0003,
-- migration 0007). pgcrypto provides gen_random_uuid() for PKs.

create extension if not exists btree_gist;
create extension if not exists pgcrypto;
