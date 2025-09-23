# ⚛️ Radioactive Forms

A powerful, lightweight, and highly customizable React form library that makes form management effortless with reactive state handling and built-in validation.

[![npm version](https://badge.fury.io/js/radioactive-forms.svg)](https://badge.fury.io/js/radioactive-forms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🚀 **Lightweight** - Minimal bundle size with zero dependencies
- ⚡ **Reactive** - Real-time form state updates with automatic re-rendering
- 🛡️ **Type Safe** - Full TypeScript support with intelligent type inference
- 🎯 **Validation** - Built-in validation with custom rules and async validation
- 🎨 **Flexible** - Works with any UI library (Material-UI, Ant Design, etc.)
- 📱 **Accessible** - ARIA compliance and keyboard navigation support
- 🔧 **Developer Friendly** - Intuitive API with excellent debugging tools

## 📦 Installation

```bash
npm install radioactive-forms
```

```bash
yarn add radioactive-forms
```

```bash
pnpm add radioactive-forms
```

## 🚀 Quick Start

```tsx
import React from 'react';
import { useRadioactiveForm } from 'radioactive-forms';

function LoginForm() {
  const form = useRadioactiveForm({
    initialValues: {
      email: '',
      password: ''
    },
    validation: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      }
    },
    onSubmit: async (values) => {
      console.log('Form submitted:', values);
      // Handle form submission
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={form.values.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
        />
        {form.errors.email && form.touched.email && (
          <span className="error">{form.errors.email}</span>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          value={form.values.password}
          onChange={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
        />
        {form.errors.password && form.touched.password && (
          <span className="error">{form.errors.password}</span>
        )}
      </div>

      <button type="submit" disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## 📖 API Reference

### `useRadioactiveForm(options)`

The main hook for creating a reactive form instance.

#### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `initialValues` | `object` | ✅ | Initial form values |
| `validation` | `object` | ❌ | Validation rules for each field |
| `onSubmit` | `function` | ❌ | Form submission handler |
| `validateOnChange` | `boolean` | ❌ | Validate fields on change (default: true) |
| `validateOnBlur` | `boolean` | ❌ | Validate fields on blur (default: true) |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `values` | `object` | Current form values |
| `errors` | `object` | Current validation errors |
| `touched` | `object` | Fields that have been interacted with |
| `isValid` | `boolean` | Whether the form is valid |
| `isSubmitting` | `boolean` | Whether the form is currently submitting |
| `handleChange` | `function` | Field change handler |
| `handleBlur` | `function` | Field blur handler |
| `handleSubmit` | `function` | Form submission handler |
| `setFieldValue` | `function` | Programmatically set field value |
| `setFieldError` | `function` | Programmatically set field error |
| `resetForm` | `function` | Reset form to initial state |

## 🎯 Advanced Examples

### Complex Form with Nested Objects

```tsx
import { useRadioactiveForm } from 'radioactive-forms';

function UserProfileForm() {
  const form = useRadioactiveForm({
    initialValues: {
      user: {
        firstName: '',
        lastName: '',
        email: ''
      },
      address: {
        street: '',
        city: '',
        zipCode: ''
      },
      preferences: {
        newsletter: false,
        notifications: true
      }
    },
    validation: {
      'user.firstName': (value) => value ? null : 'First name is required',
      'user.lastName': (value) => value ? null : 'Last name is required',
      'user.email': (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email';
        return null;
      }
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <fieldset>
        <legend>Personal Information</legend>
        <input
          placeholder="First Name"
          value={form.values.user.firstName}
          onChange={form.handleChange('user.firstName')}
        />
        <input
          placeholder="Last Name"
          value={form.values.user.lastName}
          onChange={form.handleChange('user.lastName')}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.values.user.email}
          onChange={form.handleChange('user.email')}
        />
      </fieldset>

      <fieldset>
        <legend>Address</legend>
        <input
          placeholder="Street"
          value={form.values.address.street}
          onChange={form.handleChange('address.street')}
        />
        <input
          placeholder="City"
          value={form.values.address.city}
          onChange={form.handleChange('address.city')}
        />
        <input
          placeholder="Zip Code"
          value={form.values.address.zipCode}
          onChange={form.handleChange('address.zipCode')}
        />
      </fieldset>

      <fieldset>
        <legend>Preferences</legend>
        <label>
          <input
            type="checkbox"
            checked={form.values.preferences.newsletter}
            onChange={form.handleChange('preferences.newsletter')}
          />
          Subscribe to newsletter
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.values.preferences.notifications}
            onChange={form.handleChange('preferences.notifications')}
          />
          Enable notifications
        </label>
      </fieldset>

      <button type="submit" disabled={!form.isValid}>
        Save Profile
      </button>
    </form>
  );
}
```

### Async Validation

```tsx
import { useRadioactiveForm } from 'radioactive-forms';

function SignupForm() {
  const form = useRadioactiveForm({
    initialValues: {
      username: '',
      email: ''
    },
    validation: {
      username: async (value) => {
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        
        // Simulate API call to check availability
        const isAvailable = await checkUsernameAvailability(value);
        return isAvailable ? null : 'Username is already taken';
      },
      email: async (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        
        const isAvailable = await checkEmailAvailability(value);
        return isAvailable ? null : 'Email is already registered';
      }
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        placeholder="Username"
        value={form.values.username}
        onChange={form.handleChange('username')}
        onBlur={form.handleBlur('username')}
      />
      {form.errors.username && (
        <span className="error">{form.errors.username}</span>
      )}

      <input
        type="email"
        placeholder="Email"
        value={form.values.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
      />
      {form.errors.email && (
        <span className="error">{form.errors.email}</span>
      )}

      <button type="submit" disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}

async function checkUsernameAvailability(username: string): Promise<boolean> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return !['admin', 'user', 'test'].includes(username.toLowerCase());
}

async function checkEmailAvailability(email: string): Promise<boolean> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return !['test@example.com', 'admin@example.com'].includes(email.toLowerCase());
}
```

### Dynamic Fields (Array of Objects)

```tsx
import { useRadioactiveForm } from 'radioactive-forms';

function ContactsForm() {
  const form = useRadioactiveForm({
    initialValues: {
      contacts: [
        { name: '', email: '', phone: '' }
      ]
    },
    validation: {
      'contacts.*.name': (value) => value ? null : 'Name is required',
      'contacts.*.email': (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email';
        return null;
      }
    }
  });

  const addContact = () => {
    const newContacts = [...form.values.contacts, { name: '', email: '', phone: '' }];
    form.setFieldValue('contacts', newContacts);
  };

  const removeContact = (index: number) => {
    const newContacts = form.values.contacts.filter((_, i) => i !== index);
    form.setFieldValue('contacts', newContacts);
  };

  return (
    <form onSubmit={form.handleSubmit}>
      <h3>Contacts</h3>
      {form.values.contacts.map((contact, index) => (
        <div key={index} className="contact-group">
          <input
            placeholder="Name"
            value={contact.name}
            onChange={form.handleChange(`contacts.${index}.name`)}
          />
          <input
            type="email"
            placeholder="Email"
            value={contact.email}
            onChange={form.handleChange(`contacts.${index}.email`)}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={contact.phone}
            onChange={form.handleChange(`contacts.${index}.phone`)}
          />
          {form.values.contacts.length > 1 && (
            <button
              type="button"
              onClick={() => removeContact(index)}
              className="remove-btn"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      
      <button type="button" onClick={addContact} className="add-btn">
        Add Contact
      </button>
      
      <button type="submit" disabled={!form.isValid}>
        Save Contacts
      </button>
    </form>
  );
}
```

## 🎨 Integration with UI Libraries

### Material-UI

```tsx
import { TextField, Button, FormControlLabel, Checkbox } from '@mui/material';
import { useRadioactiveForm } from 'radioactive-forms';

function MaterialUIForm() {
  const form = useRadioactiveForm({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={form.values.email}
        onChange={(e) => form.handleChange('email')(e)}
        onBlur={form.handleBlur('email')}
        error={!!(form.errors.email && form.touched.email)}
        helperText={form.touched.email && form.errors.email}
        margin="normal"
      />
      
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={form.values.password}
        onChange={(e) => form.handleChange('password')(e)}
        onBlur={form.handleBlur('password')}
        error={!!(form.errors.password && form.touched.password)}
        helperText={form.touched.password && form.errors.password}
        margin="normal"
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={form.values.rememberMe}
            onChange={form.handleChange('rememberMe')}
          />
        }
        label="Remember me"
      />
      
      <Button
        type="submit"
        variant="contained"
        disabled={form.isSubmitting || !form.isValid}
        fullWidth
      >
        Login
      </Button>
    </form>
  );
}
```

## 🔧 TypeScript Support

Radioactive Forms is built with TypeScript and provides excellent type safety:

```tsx
interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

function TypedLoginForm() {
  const form = useRadioactiveForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false
    },
    validation: {
      email: (value: string) => {
        // TypeScript knows 'value' is a string
        if (!value) return 'Email is required';
        return null;
      }
    },
    onSubmit: async (values: LoginFormValues) => {
      // TypeScript knows the exact shape of 'values'
      console.log('Email:', values.email);
      console.log('Password:', values.password);
      console.log('Remember me:', values.rememberMe);
    }
  });

  // All form properties are properly typed
  const { values, errors, handleChange, handleSubmit } = form;
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## 🧪 Testing

Radioactive Forms is designed to be easily testable:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRadioactiveForm } from 'radioactive-forms';

function TestForm() {
  const form = useRadioactiveForm({
    initialValues: { email: '' },
    validation: {
      email: (value) => value ? null : 'Email is required'
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        data-testid="email-input"
        value={form.values.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
      />
      {form.errors.email && <span data-testid="email-error">{form.errors.email}</span>}
      <button type="submit" disabled={!form.isValid}>Submit</button>
    </form>
  );
}

test('shows validation error for empty email', async () => {
  render(<TestForm />);
  
  const emailInput = screen.getByTestId('email-input');
  fireEvent.blur(emailInput);
  
  await waitFor(() => {
    expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
  });
});
```

## 🌟 Best Practices

### 1. Use TypeScript for Better Development Experience

```tsx
// ✅ Good: Define your form shape
interface UserForm {
  name: string;
  age: number;
  email: string;
}

const form = useRadioactiveForm<UserForm>({
  initialValues: {
    name: '',
    age: 0,
    email: ''
  }
});
```

### 2. Memoize Validation Functions

```tsx
// ✅ Good: Memoize expensive validation
const emailValidation = useCallback((value: string) => {
  if (!value) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email';
  return null;
}, []);

const form = useRadioactiveForm({
  initialValues: { email: '' },
  validation: {
    email: emailValidation
  }
});
```

### 3. Handle Loading States

```tsx
function LoadingAwareForm() {
  const form = useRadioactiveForm({
    initialValues: { message: '' },
    onSubmit: async (values) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Submitted:', values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <textarea
        value={form.values.message}
        onChange={form.handleChange('message')}
        disabled={form.isSubmitting}
      />
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Identityofsine/radioactive-forms.git

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the library
npm run build

# Run example application
npm run dev
```

## 📄 License

MIT © [Identityofsine](https://github.com/Identityofsine)

## 🙏 Acknowledgments

- Inspired by Formik and React Hook Form
- Built with modern React patterns and TypeScript
- Designed for developer experience and performance

---

Made with ❤️ by the Radioactive Forms team