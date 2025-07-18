import React, { useState } from "react";
import useWebSocket from "../hooks/useWebSocket";

const Home = () => {
  const { sendMessage, message, isConnected } = useWebSocket();
  const [formData, setFormData] = useState({
    app: "",
    query: "",
    location: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(JSON.stringify(formData));
  };

  return (
    <div
      style={{
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "80vw",
          maxWidth: "600px",
          minWidth: "300px",
          padding: "20px",
          border: "1px solid white",
          borderRadius: "10px",
          boxSizing: "border-box",
          color: "black",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "10px", color: "white" }}>
          <span>Connected</span> {isConnected ? <div style={{ width: "10px", height: "10px", borderRadius: "10px", backgroundColor: "green" }}></div> : <div style={{ width: "10px", height: "10px", borderRadius: "10px", backgroundColor: "red" }}></div>}
        </div>
        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.2rem",
          }}
        >
          <label style={{ fontSize: "0.7rem", color: "white" }}>Select Option</label>
          <select
            name="app"
            value={formData.app}
            onChange={handleChange}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "4px",
            }}
          >
            <option value="">-- Choose --</option>
            <option value={"Myntra"}>Myntra</option>
            <option value={"Nykaa"}>Nykaa</option>
            <option value={"Pinterest"}>Pinterest</option>
            <option value={"Instagram"}>Instagram</option>
          </select>
        </div>

        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.2rem",
          }}
        >
          <label style={{ fontSize: "0.7rem", color: "white" }}>Search Query</label>
          <input
            type="text"
            name="query"
            value={formData.query}
            onChange={handleChange}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.2rem",
          }}
        >
          <label style={{ fontSize: "0.7rem", color: "white" }}>Folder Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="submit"
            style={{
              padding: "6px 40px",
              borderRadius: "10px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
            }}
          >
            Submit
          </button>
        </div>
        <small style={{ textAlign: "center", color: "white" }}>{message}</small>
      </form>
    </div>
  );
};

export default Home;
