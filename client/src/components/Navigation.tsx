import { Link } from "react-router-dom"
import { useEffect, useState} from "react";

const Navigation = () => {
    const [jwt, setJwt] = useState<string | null>(null);

    useEffect(() => {
        if(localStorage.getItem("token")) {
            setJwt(localStorage.getItem("token"));
        }
    })

    const handleLanguageChange = (language:string) => {
        console.log(language)
    }
    const handleLightModeChange = (mode:string) => {
        console.log(mode)
    }
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setJwt(null);
        window.location.href = "/"
    }


    return (
    <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/">home</Link>

        {!jwt ? (
            <>
                <Link to="/login">login</Link>
                <Link to="/register">register</Link>
            </>
        ) : (
            <button onClick={logout}>logout</button>
        )}

        <button onClick={() => handleLanguageChange("fi")}>FI</button>
        <button onClick={() => handleLanguageChange("en")}>EN</button>

        <button onClick={() => handleLightModeChange("light")}>Light</button>
        <button onClick={() => handleLightModeChange("dark")}>Dark</button>
    </nav>
    );
}

export default Navigation;