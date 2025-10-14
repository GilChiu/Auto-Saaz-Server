import { createClient } from '@supabase/supabase-js';
import { User } from '../models/user.model';
import { supabase } from '../config/supabase';

const seedUsers = async () => {
    const users = [
        { email: 'user1@example.com', password: 'password123' },
        { email: 'user2@example.com', password: 'password123' },
        { email: 'admin@example.com', password: 'adminpassword', role: 'admin' },
    ];

    for (const user of users) {
        const { data, error } = await supabase
            .from<User>('users')
            .insert([{ email: user.email, password: user.password, role: user.role || 'user' }]);

        if (error) {
            console.error('Error seeding user:', error);
        } else {
            console.log('Seeded user:', data);
        }
    }
};

const runSeed = async () => {
    await seedUsers();
    console.log('Seeding completed.');
};

runSeed().catch((error) => {
    console.error('Seeding failed:', error);
});