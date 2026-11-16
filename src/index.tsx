import "./index.css";
import React from "react";
import { render } from "react-dom";
import { MotionConfig } from "framer-motion";
import { App } from "./App";
import { FleetStoreProvider } from "./state/FleetStore";

render(
  <MotionConfig reducedMotion="user">
    <FleetStoreProvider>
      <App />
    </FleetStoreProvider>
  </MotionConfig>,
  document.getElementById("root")
);