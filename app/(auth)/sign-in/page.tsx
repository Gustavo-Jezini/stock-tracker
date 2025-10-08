'use client'
import FooterLink from "@/components/FooterLink";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import InputField from "@/components/forms/fields";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function SignIn() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInFormData>({
    defaultValues: { 
      email: '',
      password: '',
    },
    mode: 'onBlur'
  } )

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data);
      if (!result.success) throw new Error(result.error);

      router.push('/');
    } catch (e) {
      console.log(e)
      toast.error('Sign in failed. Please try again.', {
        description: e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.'
      });
    } 
  }

  return ( 
  <>
    <h1 className="form-title">Login Your Account</h1>

    <form  onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <InputField 
        name="email"
        label="Email"
        placeholder="your-email@email.com"
        register={register}
        error={errors.email}
        validation={{ 
          required: "Email is Required", 
          pattern: { 
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
            message: 'Please enter a valid email address' 
          }
        }}
      />
      <InputField 
        name="password"
        label="Password"
        placeholder="Enter a strong password"
        type="password"
        register={register}
        error={errors.password}
        validation={{ required: "Password is Required", minLength: 8 }}
      />

      <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
        {isSubmitting ? 'Signing In' : 'Sign In' }
      </Button>

      <FooterLink text="Create Accoutn" linkText="Sign Up" href="/sign-up" />
    </form>
  </>  );
}

export default SignIn;