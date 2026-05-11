import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./Login.css";
import api from "@/api/api";
type ViewState = "login" | "register" | "forgot";

export default function Login() {
  const [view, setView] = useState<ViewState>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});


  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = "Vui lòng nhập email hoặc số điện thoại.";
    } else if (
      !emailRegex.test(formData.emailOrPhone) &&
      !phoneRegex.test(formData.emailOrPhone)
    ) {
      newErrors.emailOrPhone =
        "Định dạng email hoặc số điện thoại không hợp lệ.";
    }

    if (view === "register") {
      if (formData.name.trim().length < 2) {
        newErrors.name = "Vui lòng nhập họ và tên hợp lệ.";
      }
      if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      }
    }

    if (view === "login") {
      if (formData.password.length < 6) {
        newErrors.password = "Vui lòng nhập mật khẩu hợp lệ.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (validate()) {
      setIsLoading(true);

      try {
        if (view === "login") {
          const response = await api.post("auth/login", {
            login_id: formData.emailOrPhone, 
            password: formData.password,
          });

          const responseData = response.data?.data || response.data;
          const token = responseData.access_token || responseData.token;
          const user = responseData.user;

          if (token) {
            localStorage.setItem("access_token", token);
            if (user) {
              localStorage.setItem("current_user", JSON.stringify(user));
            }
            toast.success(response.data?.message || "Đăng nhập thành công!");
            navigate("/chat");
          }
        } else if (view === "register") {
          const response = await api.post("/register", {
            name: formData.name,
            email: formData.emailOrPhone,
            password: formData.password,
            password_confirmation: formData.confirmPassword,
          });

          toast.success(
            response.data?.message || "Đăng ký thành công! Vui lòng đăng nhập.",
          );
          changeView("login");
        } else if (view === "forgot") {
          const response = await api.post("/forgot-password", {
            email: formData.emailOrPhone,
          });

          setResetSent(true);
          toast.success(
            response.data?.message ||
              "Liên kết khôi phục đã được gửi đến email của bạn.",
          );
        }
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          "Có lỗi xảy ra, vui lòng thử lại sau.";
        toast.error(message);

        if (error.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          const mappedErrors: Record<string, string> = {};

          if (validationErrors.email)
            mappedErrors.emailOrPhone = validationErrors.email[0];
          if (validationErrors.password)
            mappedErrors.password = validationErrors.password[0];

          setErrors(mappedErrors);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const changeView = (newView: ViewState) => {
    setView(newView);
    setErrors({});
    setResetSent(false);
    setFormData({
      name: "",
      emailOrPhone: "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="login-wrapper">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="login-content">
        <div className="login-logo"></div>

        <h1 className="login-title">
          {view === "forgot"
            ? "Khôi phục mật khẩu"
            : view === "register"
              ? "Tạo tài khoản mới."
              : "Kết nối với những người bạn yêu quý."}
        </h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {resetSent && view === "forgot" && (
            <div className="success-msg">
              Liên kết khôi phục đã được gửi đến email của bạn.
            </div>
          )}

          {view === "register" && (
            <div className="input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Họ và tên của bạn"
                className={`login-input ${errors.name ? "login-input-error" : ""}`}
                disabled={isLoading}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleChange}
              placeholder="Email hoặc số điện thoại"
              className={`login-input ${errors.emailOrPhone ? "login-input-error" : ""}`}
              disabled={isLoading}
            />
            {errors.emailOrPhone && (
              <span className="error-text">{errors.emailOrPhone}</span>
            )}
          </div>

          {view !== "forgot" && (
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu"
                className={`login-input login-input-password ${errors.password ? "login-input-error" : ""}`}
                disabled={isLoading}
              />
              <div
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>
          )}

          {view === "register" && (
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Xác nhận lại mật khẩu"
                className={`login-input login-input-password ${errors.confirmPassword ? "login-input-error" : ""}`}
                disabled={isLoading}
              />
              <div
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          {view === "login" && (
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                className="checkbox-input"
                disabled={isLoading}
              />
              Duy trì đăng nhập
            </label>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading
              ? "Đang xử lý..."
              : view === "forgot"
                ? "Gửi liên kết khôi phục"
                : view === "register"
                  ? "Đăng ký"
                  : "Đăng nhập"}
          </button>

          {view === "login" && (
            <>
              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">Hoặc</span>
                <div className="divider-line"></div>
              </div>

              <button type="button" className="social-btn" disabled={isLoading}>
                <i className="icon-google"></i>
                Tiếp tục với Google
              </button>

              <button type="button" className="social-btn" disabled={isLoading}>
                <i className="icon-facebook"></i>
                Tiếp tục với Facebook
              </button>
            </>
          )}
        </form>
      </div>

      <footer className="login-footer">
        {view === "login" ? (
          <>
            <span className="login-link" onClick={() => changeView("forgot")}>
              Quên mật khẩu?
            </span>
            <span
              className="login-link-bold"
              onClick={() => changeView("register")}
            >
              Chưa có tài khoản? Đăng ký
            </span>
          </>
        ) : (
          <span className="login-link-bold" onClick={() => changeView("login")}>
            Quay lại trang Đăng nhập
          </span>
        )}
      </footer>
    </div>
  );
}
