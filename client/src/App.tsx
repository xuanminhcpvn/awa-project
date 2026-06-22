import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Navigation from './components/Navigation'
import Editor from './components/Editor';
function App() {
  return (
    <>
    <BrowserRouter>
      <Navigation />
      <div className="App"></div>
      <h1>File Drive App</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:fileId" element={<Editor />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
