/*CT30A3204 Advanced Web Applications Final Project
  Author: Minh Pham
  Created at: 20/06/2026
  Last modified at: 23/06/206
*/

import { useState } from "react";

const loginUser = async (username: string,password: string,setLoading: (value: boolean) => void ) => {
    try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                password
            })
        });

        if (!response.ok) {
            throw new Error("Error fetching data");
        }

        const data = await response.json();
        console.log(data);
        // Store token to localStorage if backend return JWT 
        if (data.token) {
            localStorage.setItem("token", data.token);
        }
        // Redirect to Drive Home page after login
        if (response.status === 200) {
            window.location.href = "/";
        }
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error when trying to login: ${error.message}`);
        }
    } finally {
        setLoading(false);
    }
};

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    return (
        <div>
            <h2>Login</h2>
            {/* Username input */}
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            {/* Password input */}
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {/* Submit button */}
            <button onClick={() => loginUser(username, password, setLoading)} disabled={loading}>
                {loading ? "Logging in..." : "Login"}
            </button>
        </div>
    );
};

export default Login;