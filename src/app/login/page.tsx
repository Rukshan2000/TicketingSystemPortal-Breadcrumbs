'use client';

import Image from 'next/image';
import tmsLogo from '@/assets/text.png';
import Logo from '@/assets/logo.jpg';
import bgImage from '@/assets/bg.jpeg';
import phone from '@/assets/phone.jpg';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSelector } from 'react-redux';
import { useLoginMutation } from '@/store/services/authApi';
import { useAppDispatch, RootState } from '@/store';
import { setCredentials } from '@/store/features/authSlice';
import { Button } from '@/components/ui/button';
import LogoLg from '@/assets/f2.jpg';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      
      // Call the API with type: "portal"
      const response = await login({
        ...data,
        type: 'portal',
      }).unwrap();
      
      // Check if login was successful
      if (response.success && response.data) {
        // Check if user has "portal" permission (id: 9)
        const hasPortalPermission = (response.data.user as any).permissions?.some(
          (permission: any) =>  permission.name === 'portal'
        );

        if (!hasPortalPermission) {
          setError('You do not have access to this portal. Please contact your administrator.');
          return;
        }

        // Dispatch credentials with the correct data structure
        dispatch(setCredentials({
          user: response.data.user,
          tokens: response.data.tokens,
        }));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      // Extract error message from different possible error formats
      let errorMessage = 'Login failed. Please try again.';
      
      // Log detailed error information for debugging
      console.error('Login error - Full error object:', err);
      console.error('Login error - Error keys:', Object.keys(err || {}));
      
      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.status) {
        // Handle network errors with status codes
        if (err.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Error (${err.status}): ${err.statusText || 'Unknown error'}`;
        }
      }
      
      console.error('Login error - Final message:', errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden"
    >
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 h-screen items-center justify-center bg-white p-8">
        <div className="relative w-full h-full max-w-md">
          <Image
            src={phone}
            alt="Phone"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-2xl border-0 bg-white rounded-2xl">
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="flex justify-center mb-2">
              <Image
                src={LogoLg}  
                alt="TMS Portal Logo"
                width={50}
                height={100}
                priority
                className="w-auto h-auto max-w-[10rem]"
              />
            </div>
            <CardDescription className="text-lg font-semibold text-gray-700">
              Sign In
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@example.com"
                          type="email"
                          className="h-11 rounded-lg border-gray-200"
                          {...field}
                        />
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
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          className="h-11 rounded-lg border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full h-11 rounded-lg font-semibold" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
