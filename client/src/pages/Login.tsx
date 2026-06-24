/*CT30A3204 Advanced Web Applications Final Project
  Author: Minh Pham
  Created at: 20/06/2026
  Last modified at: 24/06/206
*/
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const loginUser = async (username: string,password: string,setLoading: (value: boolean) => void,navigate: any,t: any) => {
    try {
        setLoading(true);
        const res = await fetch("/api/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                password
            })
        });
        if (!res.ok) {
            switch (res.status) {
                case 400:
                    alert(t("Username and password required"));
                    break;
                case 401:
                    alert(t("Invalid username or password"));
                    break;
                case 403:
                    alert(t("User not found. Register first!"));
                    navigate("/register");
                    break;
                default:
                    alert(t("Login failed. Error fetching data"));
            }
            return;
        }
        
        const data = await res.json();
        console.log(data);
        // Store token to localStorage if backend return JWT 
        if (data.token) {
            localStorage.setItem("token", data.token);
        }
        // Redirect to Drive Home page after login
        if (res.status === 200) {
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
    const { t } = useTranslation();
    const navigate = useNavigate();
    return (
        //style modified by AI
        <div style={{ padding: "20px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px"}}><h2>{t("Login Page")}</h2>
            {/* Username input */}
            <input style={{ padding: "8px" }} type="text" placeholder={t("Username")} value={username} onChange={(e) => setUsername(e.target.value)}/>
            {/* Password input */}
            <input style={{ padding: "8px" }} type="password"placeholder={t("Password")} value={password} onChange={(e) => setPassword(e.target.value)}/>
            {/* Submit button */}
            <button onClick={() => loginUser(username, password, setLoading, navigate, t)} disabled={loading}>{loading ? t("Logging in...") : t("Login")}</button>
        </div>
    );
};
export default Login;