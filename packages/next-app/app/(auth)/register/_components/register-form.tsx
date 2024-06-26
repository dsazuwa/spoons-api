'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { TypeOf, object, string } from 'zod';

import { register } from '@/app/actions/auth';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const formSchema = object({
  firstName: string().trim().min(1, 'First name required'),
  lastName: string().trim().min(1, 'Last name required'),
  email: string().email({ message: 'Invalid email address' }),
  password: string()
    .trim()
    .min(8, { message: 'Password must be 8 or more characters long' })
    .max(64, { message: 'Password must be 64 or fewer characters long' })
    .regex(/\d/, { message: 'Password must contain at least 1 digit' })
    .regex(/[a-z]/, {
      message: 'Password must contain at least 1 lowercase character',
    })
    .regex(/[A-Z]/, {
      message: 'Password must contain at least 1 uppercase letter',
    }),
  confirm: string().trim(),
}).refine((data) => data.password === data.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormSchema = TypeOf<typeof formSchema>;

export default function RegisterForm() {
  const router = useRouter();

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const [state, formAction] = useFormState(register, {
    isSuccess: false,
    message: '',
  });

  const form = useForm<FormSchema>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirm: '',
    },
    resolver: zodResolver(formSchema),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitSuccessful },
  } = form;

  useEffect(() => {
    if (isSubmitSuccessful) {
      setIsLoading(true);
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  useEffect(() => {
    if (state.message === '') return;

    setIsLoading(false);

    if (state.isSuccess) {
      toast({ variant: 'success', description: state.message });
      router.push('/verify');
    } else {
      toast({ variant: 'destructive', description: state.message });
    }
  }, [state, router, toast]);

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void handleSubmit(formAction)(event)}
        className='flex w-full flex-col gap-4'
      >
        <div className='flex w-full flex-col gap-2'>
          <div className='grid w-full grid-cols-1 gap-2 sm:grid-cols-2'>
            <FormField
              control={control}
              name='firstName'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>First Name</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      className='w-full text-xs'
                      autoComplete='new-password'
                      autoFocus
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name='lastName'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Last Name</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      className='w-full text-xs'
                      autoComplete='new-password'
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-xs'>Email Address</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    className='w-full text-xs'
                    autoComplete='new-password'
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-xs'>Password</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    className='w-full text-xs'
                    type='password'
                    autoComplete='new-password'
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='confirm'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-xs'>Confirm Password</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    className='w-full text-xs'
                    type='password'
                    autoComplete='new-password'
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type='submit'
          disabled={isLoading}
          className='w-full bg-primary-600 hover:bg-primary'
        >
          {isLoading ? <Loader size='sm' /> : <span>Sign Up</span>}
        </Button>
      </form>
    </Form>
  );
}
