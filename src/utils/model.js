import { createContext, useContext } from "react";

// Active probability model for the whole app.
//   "poly" — cube-root of Polymarket championship odds (default)
//   "mv"   — squared Transfermarkt market values (legacy, kept for comparison)
export const ModelContext = createContext("poly");

// Convenience hook used by MCard / FlowCard so match-probability rendering
// always follows the currently-selected model without prop drilling.
export const useModel = () => useContext(ModelContext);
