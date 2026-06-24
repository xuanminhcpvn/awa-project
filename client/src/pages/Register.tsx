/*CT30A3204 Advanced Web Applications Final Project
  Author: Minh Pham
  Created at: 20/06/2026
  Last modified at: 23/06/206
*/
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
const registerUser = async (username: string, email: string, password: string,image: File | null, setLoading: (value: boolean) => void, navigate: any,t: any) => {
    try {
        setLoading(true);
        // Might need to refactor when the user model gets more complex
        //=> response in formData format
        const formData: FormData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", password);

        // Profile image (optional)
        if (image) {
            formData.append("image", image);
        }

        const res = await fetch("/api/user/register", {
            method: "POST",
            body: formData
        });
        
        if (!res.ok) {
            switch (res.status) {
                case 400:
                    alert(t("Username, email and password required"));
                    break;
                case 403:
                    alert(t("User already exists. Redirecting to login..."));
                    navigate("/login");
                    break;
                default:
                    alert(t("Registration failed. Error fetching data"));
            }
            return;
        }
        window.location.href = "/login";

    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error when trying to register: ${error.message}`);
        }
    } finally {
        setLoading(false);
    }
};
const Register = () => {
    // Might need to refactor when the user model gets more complex
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();  
    const navigate = useNavigate();
    return (
    <div style={{ padding: "20px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px"}}>
        <h2>{t("Registration Page")}</h2>
        {/* Username input */}
        <input style={{ padding: "8px" }} type="text" placeholder={t("Username")} value={username} onChange={(e) => setUsername(e.target.value)}/>
        {/* Email input */}
        <input  style={{ padding: "8px" }}type="email" placeholder={t("Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        {/* Password input */}
        <input style={{ padding: "8px" }} type="password" placeholder={t("Password")}value={password} onChange={(e) => setPassword(e.target.value)}/>
        {/* Profile image input */}
        <input type="file" accept="image/*" onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
                setImage(e.target.files[0]);
            }
        }}
        />
        {/* Submit button */}
        <button onClick={() => registerUser(username,email, password, image, setLoading, navigate, t)} disabled={loading}>{loading ? t("Registering...") : t("Register")}</button>
    </div>
    );
};
export default Register;