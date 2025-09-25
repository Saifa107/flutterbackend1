import { createPool } from 'mysql2/promise';

export const conn = createPool({
    connectionLimit: 10,
    host: '202.28.34.203',
    user: 'mb68_65011212203',
    password: 'XymUqFIKnU3y',
    database: 'mb68_65011212203'
});