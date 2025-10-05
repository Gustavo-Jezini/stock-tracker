'use client'
import FooterLink from "@/components/FooterLink";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import InputField from "@/components/forms/fields";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import { useForm } from "react-hook-form";

function SignIn() {

  const {
    register,
    handleSubmit,
    control,
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
      console.log(data)
    } catch (e) {
      console.log(e)
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
        validation={{ required: "Email is Required", pattern: /ˆ\w+@\w+\.\w+$/, message: 'Email address is required' }}
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