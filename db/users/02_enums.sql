CREATE TYPE users.enum_admin_status AS ENUM ('active', 'pending', 'disabled');
CREATE TYPE users.enum_customer_status AS ENUM ('active', 'pending', 'suspended', 'deactivated');
CREATE TYPE users.enum_admin_otps_type AS ENUM ('email', 'password', 'phone', 'login');
CREATE TYPE users.enum_customer_otps_type AS ENUM ('email', 'password', 'phone');
CREATE TYPE users.enum_customer_identities_provider AS ENUM ('google', 'facebook');
CREATE TYPE users.enum_admin_phones_status AS ENUM ('active', 'pending');
CREATE TYPE users.enum_customer_phones_status AS ENUM ('active', 'pending');