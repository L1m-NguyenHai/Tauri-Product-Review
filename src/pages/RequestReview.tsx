import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Link,
  DollarSign,
  Tag,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useNotification } from "../components/Notification";
import { reviewRequestAPI } from "../services/api";

const RequestReview: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification, NotificationComponent } = useNotification();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    productName: "",
    manufacturer: "",
    category: "",
    productUrl: "",
    price: "",
    availability: "",
    description: "",
    reasoning: "",
    contactEmail: user?.email || "",
  });
  const [loading, setLoading] = useState(false);

  // Use shared categories from context (cached with React Query)
  const { categories: fetchedCategories } = useCategories();
  const categories = fetchedCategories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
  }));

  // Format number as VND string
  const formatVND = (value: string | number) => {
    const num = typeof value === "string" ? parseInt(value, 10) : value;
    if (!num || isNaN(num)) return "";
    return num.toLocaleString("vi-VN") + " ₫";
  };

  // Only allow numbers for price
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({
        ...formData,
        price: value,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.productName &&
          formData.manufacturer &&
          formData.category
        );
      case 2:
        return !!formData.reasoning;
      case 3:
        return !!formData.contactEmail;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      showNotification(
        "warning",
        "Please fill in all required fields before proceeding"
      );
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      showNotification("warning", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        product_name: formData.productName,
        manufacturer: formData.manufacturer,
        product_url: formData.productUrl,
        reason: formData.reasoning,
        priority: "normal",
      };

      await reviewRequestAPI.createReviewRequest(payload);

      setLoading(false);
      showNotification(
        "success",
        "Review request submitted successfully! We'll review your suggestion and get back to you soon."
      );

      // Navigate after a short delay to let user see the success message
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      showNotification("error", `Error: ${err.message}`);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              step === currentStep
                ? "border-blue-500 bg-blue-500 text-white"
                : step < currentStep
                ? "border-green-500 bg-green-500 text-white"
                : isDark
                ? "border-gray-600 text-gray-400"
                : "border-gray-300 text-gray-500"
            }`}
          >
            {step < currentStep ? (
              <Check className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{step}</span>
            )}
          </div>
          {step < totalSteps && (
            <div
              className={`w-16 h-0.5 mx-2 ${
                step < currentStep
                  ? "bg-green-500"
                  : isDark
                  ? "bg-gray-600"
                  : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step titles
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Product Information";
      case 2:
        return "Details & Reasoning";
      case 3:
        return "Contact & Review";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Tell us about the product you'd like us to review";
      case 2:
        return "Provide additional details and explain why this product should be reviewed";
      case 3:
        return "Review your submission and provide contact information";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {NotificationComponent}

      {/* Header removed as requested */}

      {/* Step Indicator */}
      <StepIndicator />

      {/* Current Step Title */}
      <div className="text-center">
        <h2
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {getStepTitle()}
        </h2>
        <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {getStepDescription()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Product Information */}
        {currentStep === 1 && (
          <div
            className={`rounded-xl p-6 ${
              isDark ? "bg-gray-800" : "bg-white"
            } shadow-sm`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Product Name *
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    placeholder="e.g., iPhone 15 Pro Max"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Manufacturer *
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="e.g., Apple, Samsung, Sony"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Category *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Estimated Price (VND)
                </label>
                {formData.price && formatVND(formData.price) && (
                  <div className="mb-1 text-xs text-blue-600 font-semibold">
                    {formatVND(formData.price)}
                  </div>
                )}
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="price"
                    inputMode="numeric"
                    value={formData.price}
                    onChange={handlePriceChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    placeholder="e.g., 15000000 (VND)"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Product URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    name="productUrl"
                    value={formData.productUrl}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    placeholder="Official product page or announcement"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                >
                  <option value="">Select availability</option>
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Pre-order">Pre-order</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details & Reasoning */}
        {currentStep === 2 && (
          <div
            className={`rounded-xl p-6 ${
              isDark ? "bg-gray-800" : "bg-white"
            } shadow-sm`}
          >
            <div className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Product Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Briefly describe the product, its key features, and what makes it noteworthy..."
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Why should we review this product? *
                </label>
                <textarea
                  name="reasoning"
                  value={formData.reasoning}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Tell us why this product would be valuable to review. Is it innovative? Does it solve a unique problem? Is there high demand for information about it?"
                />
              </div>

              {/* Information Box */}
              <div
                className={`rounded-xl p-6 border ${
                  isDark
                    ? "bg-blue-900 border-blue-700"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3
                      className={`font-medium ${
                        isDark ? "text-blue-300" : "text-blue-900"
                      }`}
                    >
                      Review Process
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isDark ? "text-blue-200" : "text-blue-700"
                      }`}
                    >
                      Our editorial team reviews all submissions. Due to high
                      volume, we can't guarantee a response to every request,
                      but we do read them all. Priority is given to innovative
                      products with broad consumer interest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact & Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div
              className={`rounded-xl p-6 ${
                isDark ? "bg-gray-800" : "bg-white"
              } shadow-sm`}
            >
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="We'll use this to contact you if we decide to review the product"
                />
              </div>
            </div>

            {/* Review Summary */}
            <div
              className={`rounded-xl p-6 ${
                isDark ? "bg-gray-800" : "bg-white"
              } shadow-sm`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Review Your Submission
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Product:
                    </span>
                    <p className={`${isDark ? "text-white" : "text-gray-900"}`}>
                      {formData.productName} by {formData.manufacturer}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Category:
                    </span>
                    <p className={`${isDark ? "text-white" : "text-gray-900"}`}>
                      {categories.find((c) => c.id === formData.category)
                        ?.name || "Not selected"}
                    </p>
                  </div>
                  {formData.price && (
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Price:
                      </span>
                      <p
                        className={`${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {formData.price}
                      </p>
                    </div>
                  )}
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Contact:
                    </span>
                    <p className={`${isDark ? "text-white" : "text-gray-900"}`}>
                      {formData.contactEmail}
                    </p>
                  </div>
                </div>
                {formData.reasoning && (
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Reasoning:
                    </span>
                    <p
                      className={`mt-1 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formData.reasoning.substring(0, 200)}
                      {formData.reasoning.length > 200 ? "..." : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-3 rounded-lg border font-medium transition-colors flex items-center gap-2 ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`px-6 py-3 rounded-lg border font-medium transition-colors ${
                isDark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default RequestReview;
