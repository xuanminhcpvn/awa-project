/*CT30A3204 Advanced Web Applications Final Project
  Author: Minh Pham
  Created at: 20/06/2026
  Last modified at: 23/06/206
*/
import { useState } from "react";
const registerUser = async (username: string, email: string, password: string,image: File | null, setLoading: (value: boolean) => void) => {
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

        const res = await fetch("http://localhost:3000/api/user/register", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            throw new Error("Error fectching data");
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
    return (
        <div>
            <h2>Register</h2>
            {/* Username input */}
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            {/* Email input */}
            <input
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                />
            {/* Password input */}
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {/* Profile image input */}
            <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        setImage(e.target.files[0]);
                    }
                }}
            />
            {/* Submit button */}
            <button onClick={() => registerUser(username,email, password, image, setLoading)} disabled={loading}>
                {loading ? "Registering..." : "Register"}
            </button>
        </div>
    );
};
export default Register;