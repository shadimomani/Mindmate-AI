import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Task cannot be empty').max(200, 'Task too long'),
  priority: z.string().max(50).optional(),
});

export const habitSchema = z.object({
  name: z.string().trim().min(1, 'Habit name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  frequency: z.string().max(50).optional(),
});

export const reflectionSchema = z.object({
  content: z.string().trim().min(1, 'Reflection cannot be empty').max(2000, 'Reflection too long'),
  question: z.string().max(500),
});

export const photoUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only JPEG, PNG, WEBP, and GIF images are allowed'
    ),
});
