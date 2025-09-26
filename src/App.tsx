import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ApiConfigProvider } from "./contexts/ApiConfigContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import ReviewPage from "./pages/ReviewPage";
import RequestReview from "./pages/RequestReview";
import UserProfile from "./pages/UserProfile";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import EmailVerification from "./pages/EmailVerification";
import ResendVerification from "./pages/ResendVerification";

// Wrapper component for ProductList to pass filters to Layout
const ProductListWrapper = () => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("created_at");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Sync selectedCategory with 'category' query param
  const { search } = window.location;
  React.useEffect(() => {
    const params = new URLSearchParams(search);
    const categoryParam = params.get("category");
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    } else if (!categoryParam && selectedCategory !== "all") {
      setSelectedCategory("all");
    }
    // eslint-disable-next-line
  }, [search]);

  // Reset page to 1 when sortBy or selectedCategory changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, selectedCategory]);

  const productFilters = {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
  };

  return (
    <Layout productFilters={productFilters}>
      <ProductList
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        viewMode={viewMode}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </Layout>
  );
};
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ApiConfigProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route
                  path="/resend-verification"
                  element={<ResendVerification />}
                />
                <Route
                  path="/*"
                  element={
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <Layout>
                            <Home />
                          </Layout>
                        }
                      />
                      <Route
                        path="/products"
                        element={<ProductListWrapper />}
                      />
                      <Route
                        path="/products/:id"
                        element={
                          <Layout>
                            <ProductDetail />
                          </Layout>
                        }
                      />
                      <Route
                        path="/review/:productId"
                        element={
                          <Layout>
                            <ReviewPage />
                          </Layout>
                        }
                      />
                      <Route
                        path="/request-review"
                        element={
                          <Layout>
                            <RequestReview />
                          </Layout>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <Layout>
                            <UserProfile />
                          </Layout>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <Layout>
                            <AdminPanel />
                          </Layout>
                        }
                      />
                      <Route
                        path="/about"
                        element={
                          <Layout>
                            <About />
                          </Layout>
                        }
                      />
                      <Route
                        path="/contact"
                        element={
                          <Layout>
                            <Contact />
                          </Layout>
                        }
                      />
                    </Routes>
                  }
                />
              </Routes>
            </Router>
          </AuthProvider>
        </ApiConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
