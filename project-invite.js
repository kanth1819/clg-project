// Project invitation and access control module

const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'flowtrack'
};

// Email configuration
const emailConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Function to check if user exists
async function checkUserExists(email) {
    try {
        const [rows] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error checking user:', error);
        throw error;
    }
}

// Function to add project member
async function addProjectMember(projectId, userId, role) {
    try {
        await pool.execute(
            'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
            [projectId, userId, role]
        );
        return true;
    } catch (error) {
        console.error('Error adding project member:', error);
        throw error;
    }
}

// Function to send invitation email
async function sendInvitationEmail(email, projectName, inviterName) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Invitation to join ${projectName} on FlowTrack`,
        html: `
            <h2>You've been invited to join a project on FlowTrack!</h2>
            <p>${inviterName} has invited you to collaborate on the project: ${projectName}</p>
            <p>Click the link below to accept the invitation:</p>
            <a href="${process.env.APP_URL}/accept-invite?project=${projectName}">Accept Invitation</a>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending invitation email:', error);
        throw error;
    }
}

// Function to get project members
async function getProjectMembers(projectId) {
    try {
        const [rows] = await pool.execute(
            `SELECT u.name, u.email, pm.role 
             FROM project_members pm 
             JOIN users u ON pm.user_id = u.id 
             WHERE pm.project_id = ?`,
            [projectId]
        );
        return rows;
    } catch (error) {
        console.error('Error getting project members:', error);
        throw error;
    }
}

// Function to check user's project access
async function checkProjectAccess(userId, projectId) {
    try {
        const [rows] = await pool.execute(
            'SELECT role FROM project_members WHERE user_id = ? AND project_id = ?',
            [userId, projectId]
        );
        return rows.length > 0 ? rows[0].role : null;
    } catch (error) {
        console.error('Error checking project access:', error);
        throw error;
    }
}

module.exports = {
    checkUserExists,
    addProjectMember,
    sendInvitationEmail,
    getProjectMembers,
    checkProjectAccess
};