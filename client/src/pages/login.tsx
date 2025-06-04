import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_CONFIG } from "@/utils/constants";
import nlpLogo from "../assets/logo-nlp.webp";
// Import gambar lokal
import techImage1 from "../assets/shubham-dhage-T9rKvI3N0NM-unsplash.jpg";
import techImage2 from "../assets/shubham-sharan-OC8VNwyE47I-unsplash.jpg";
import techImage3 from "../assets/markus-spiske-Skf7HxARcoc-unsplash.jpg";
import techImage4 from "../assets/harald-arlander-aIvQqbJ9yF0-unsplash.jpg";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Slide data with tech images and descriptions
const slides = [
  {
    image: techImage1,
    title: "Analisis Sentimen",
    description: "Mengubah teks feedback karyawan menjadi insight bermakna yang dapat ditindaklanjuti untuk perbaikan organisasi"
  },
  {
    image: techImage2,
    title: "Teknologi NLP",
    description: "Memproses bahasa natural dengan algoritma machine learning terdepan untuk pemahaman konteks yang mendalam"
  },
  {
    image: techImage3,
    title: "Data Intelligence",
    description: "Transformasi data teks mentah menjadi wawasan bisnis yang dapat diukur dan diimplementasikan"
  },
  {
    image: techImage4,
    title: "Smart Analytics",
    description: "Dashboard analitik real-time untuk monitoring sentiment dan tren feedback secara komprehensif"
  }
];

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  // Auto-advance slideshow
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  // Listen for carousel changes
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    setCurrent(api.selectedScrollSnap());

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Test API connectivity on component mount
  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API connectivity to:', `${API_CONFIG.BASE_URL}/health`);
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
        const data = await response.json();
        console.log('API Health Check Success:', data);
      } catch (error) {
        console.error('API Health Check Failed:', error);
      }
    };
    testAPI();
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    console.log('Form submitted with values:', values);

    try {
      const success = await login({
        username: values.username,
        password: values.password
      });

      console.log('Login result:', success);

      if (success) {
        setLocation("/survey-dashboard");
      } else {
        setErrorMessage("Invalid credentials. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left section with Image Slideshow */}
      <div className="md:w-1/2 relative overflow-hidden">
        <Carousel
          className="w-full h-full"
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="h-screen">
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="relative h-full">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${slide.image})`
                  }}
                >
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/60" />

                  {/* Content overlay */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 text-white">
                      <h3 className="text-xl font-semibold mb-2">
                        {slide.title}
                      </h3>
                      <p className="text-sm text-gray-200 leading-relaxed">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Slide indicators */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                current === index ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      </div>

      {/* Right section with login form and larger logo */}
      <div className="md:w-1/2 bg-white flex items-center justify-center p-6 md:p-12 relative">
        {/* Larger Logo with MVP Version moved to top right */}
        <div className="absolute top-6 right-6 text-right">
          <img
            src={nlpLogo}
            alt="NLP Logo"
            className="h-32 w-40 ml-auto mb-1"
          />
          <div className="text-base text-black font-medium tracking-wide">
            MVP VERSION
          </div>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-display font-bold mb-2 text-black tracking-tight">Login</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to login</p>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {errorMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          placeholder="Username"
                          className="pl-12 py-4 rounded-2xl border-gray-200 bg-gray-50 focus-visible:ring-0 focus-visible:border-gray-300 focus-visible:bg-white transition-all text-base"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="pl-12 pr-12 py-4 rounded-2xl border-gray-200 bg-gray-50 focus-visible:ring-0 focus-visible:border-gray-300 focus-visible:bg-white transition-all text-base"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-semibold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-gray-500 mt-8">
            By clicking continue, you agree to our{" "}
            <span className="text-blue-600 font-medium">Terms of Service</span>{" "}
            and{" "}
            <span className="text-blue-600 font-medium">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
