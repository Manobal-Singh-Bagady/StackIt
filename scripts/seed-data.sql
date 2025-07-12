-- Insert sample tags
INSERT INTO tags (name, description) VALUES
('javascript', 'Questions about JavaScript programming language'),
('react', 'Questions about React.js library'),
('nextjs', 'Questions about Next.js framework'),
('typescript', 'Questions about TypeScript'),
('nodejs', 'Questions about Node.js runtime'),
('python', 'Questions about Python programming language'),
('css', 'Questions about Cascading Style Sheets'),
('html', 'Questions about HTML markup'),
('api', 'Questions about APIs and web services'),
('database', 'Questions about databases and data storage'),
('authentication', 'Questions about user authentication and security'),
('deployment', 'Questions about deploying applications'),
('performance', 'Questions about application performance'),
('testing', 'Questions about software testing'),
('debugging', 'Questions about debugging and troubleshooting')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users
INSERT INTO users (name, email, password_hash, avatar_url, role) VALUES
('John Doe', 'john@example.com', '$2b$10$example_hash_1', '/placeholder.svg?height=32&width=32', 'user'),
('Jane Smith', 'jane@example.com', '$2b$10$example_hash_2', '/placeholder.svg?height=32&width=32', 'user'),
('Mike Johnson', 'mike@example.com', '$2b$10$example_hash_3', '/placeholder.svg?height=32&width=32', 'user'),
('Admin User', 'admin@example.com', '$2b$10$example_hash_4', '/placeholder.svg?height=32&width=32', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample questions
INSERT INTO questions (title, description, author_id) VALUES
(
    'How to implement JWT authentication in Next.js?',
    '<p>I am trying to implement JWT authentication in my Next.js application but facing some issues with token storage and validation.</p><p>Here''s what I''ve tried so far:</p><ol><li>Using localStorage to store tokens</li><li>Setting up middleware for route protection</li><li>Creating login/logout functionality</li></ol><p>The main issue I''m facing is that the token seems to expire too quickly and users are getting logged out unexpectedly. Any suggestions?</p>',
    1
),
(
    'React useState vs useReducer - When to use which?',
    '<p>I am confused about when to use useState and when to use useReducer in React. Can someone explain the differences and use cases?</p><p>I understand that useReducer is good for complex state logic, but I''m not sure when exactly to make the switch from useState.</p>',
    2
),
(
    'Best practices for TypeScript in large projects',
    '<p>What are some best practices for using TypeScript in large-scale applications? Looking for advice on project structure, type definitions, and performance.</p><p>Specifically interested in:</p><ul><li>How to organize type definitions</li><li>When to use interfaces vs types</li><li>Performance considerations</li></ul>',
    3
);

-- Link questions with tags
INSERT INTO question_tags (question_id, tag_id) VALUES
(1, (SELECT id FROM tags WHERE name = 'nextjs')),
(1, (SELECT id FROM tags WHERE name = 'javascript')),
(1, (SELECT id FROM tags WHERE name = 'authentication')),
(2, (SELECT id FROM tags WHERE name = 'react')),
(2, (SELECT id FROM tags WHERE name = 'javascript')),
(3, (SELECT id FROM tags WHERE name = 'typescript')),
(3, (SELECT id FROM tags WHERE name = 'javascript'));

-- Insert sample answers
INSERT INTO answers (content, question_id, author_id, is_accepted) VALUES
(
    '<p>The issue you''re experiencing is likely due to the JWT token expiration time being set too low. Here are some solutions:</p><p><strong>1. Increase token expiration time:</strong></p><pre><code>const token = jwt.sign(payload, secret, { expiresIn: ''7d'' })</code></pre><p><strong>2. Implement refresh tokens:</strong></p><p>Use a refresh token mechanism to automatically renew access tokens before they expire.</p><p><strong>3. Use httpOnly cookies instead of localStorage:</strong></p><p>This is more secure and prevents XSS attacks.</p>',
    1,
    2,
    true
),
(
    '<p>I had a similar issue. Make sure you''re handling token refresh properly in your middleware:</p><pre><code>// middleware.js\nexport function middleware(request) {\n  const token = request.cookies.get(''token'')\n  \n  if (!token || isTokenExpired(token)) {\n    return NextResponse.redirect(new URL(''/login'', request.url))\n  }\n}</code></pre>',
    1,
    3,
    false
),
(
    '<p>Great question! Here''s when to use each:</p><p><strong>useState:</strong></p><ul><li>Simple state updates</li><li>Independent state variables</li><li>When state logic is straightforward</li></ul><p><strong>useReducer:</strong></p><ul><li>Complex state logic</li><li>Multiple sub-values</li><li>When next state depends on previous state</li></ul><p>Example of when to switch to useReducer:</p><pre><code>// Instead of multiple useState calls\nconst [loading, setLoading] = useState(false)\nconst [error, setError] = useState(null)\nconst [data, setData] = useState(null)\n\n// Use useReducer\nconst [state, dispatch] = useReducer(reducer, initialState)</code></pre>',
    2,
    1,
    true
);

-- Insert sample votes
INSERT INTO votes (user_id, target_type, target_id, vote_type) VALUES
(2, 'question', 1, 'up'),
(3, 'question', 1, 'up'),
(1, 'question', 2, 'up'),
(3, 'question', 2, 'up'),
(1, 'question', 3, 'up'),
(2, 'question', 3, 'up'),
(1, 'answer', 1, 'up'),
(3, 'answer', 1, 'up'),
(2, 'answer', 2, 'up'),
(3, 'answer', 3, 'up');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, related_question_id, related_user_id) VALUES
(1, 'answer', 'New answer on your question', 'Someone answered your question about JWT authentication', 1, 2),
(2, 'vote', 'Your answer was upvoted', 'Your answer about JWT authentication received an upvote', 1, 1),
(1, 'mention', 'You were mentioned', '@john mentioned you in a comment', 2, 3);
