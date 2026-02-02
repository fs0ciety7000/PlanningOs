import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    invoke<string>("get_app_version").then(setVersion).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">PlanningOS Desktop</h1>
          <p className="text-muted-foreground">
            Version: {version || "Loading..."}
          </p>
          <p className="text-sm text-muted-foreground">
            Desktop application powered by Tauri v2
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
