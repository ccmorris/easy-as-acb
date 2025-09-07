"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignInForm } from "./components/Auth";
import { Header } from "./components/Header";
import { PortfolioList } from "./components/PortfolioList";
import { SecurityList } from "./components/SecurityList";
import { SecurityDetail } from "./components/SecurityDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Authenticated>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<PortfolioList />} />
            <Route path="/portfolio/:portfolioId" element={<SecurityList />} />
            <Route
              path="/portfolio/:portfolioId/security/:securityId"
              element={<SecurityDetail />}
            />
          </Routes>
        </main>
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </BrowserRouter>
  );
}
