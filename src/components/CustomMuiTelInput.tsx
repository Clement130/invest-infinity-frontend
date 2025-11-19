import { styled } from '@mui/material/styles';
import { MuiTelInput, MuiTelInputProps } from 'mui-tel-input';

interface StyledProps {
  colorMode?: 'light' | 'dark';
}

export const CustomMuiTelInput = styled(
  (props: MuiTelInputProps & StyledProps) => <MuiTelInput {...props} />
)<StyledProps>(({ colorMode = 'dark' }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: colorMode === 'dark' ? '#111827' : '#ffffff',
    color: colorMode === 'dark' ? '#ffffff' : '#111827',
    borderRadius: '0.5rem',
    padding: '0 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    ...(colorMode === 'light' && {
      minHeight: '56px',
    }),
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: colorMode === 'dark' ? '#4b5563' : '#e5e7eb',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ec4899',
    },
  },

  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: colorMode === 'dark' ? '#111827' : '#e5e7eb',
    borderWidth: '2px',
  },

  /* Styles d’erreur (quand on passe error={true} au TextField) */
  '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
    borderColor: '#F87171',
  },
  '& .MuiOutlinedInput-root.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#F87171',
  },
  '& .MuiOutlinedInput-root.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#F87171',
  },

  '& .MuiInputAdornment-root': {
    color: colorMode === 'dark' ? '#ffffff' : '#111827',
    marginRight: 0,
  },

  '& .MuiTelInput-FlagButton': {
    borderRight: 'none',
    marginRight: 4,
    zIndex: 2,
  },

  '& input': {
    color: colorMode === 'dark' ? '#ffffff' : '#111827',
    borderLeft: 'none',
    '&::placeholder': {
      color: colorMode === 'dark' ? '#9ca3af' : '#6b7280',
    },
    '&:focus': {
      outline: 'none',
    },
  },

  '& .MuiAutocomplete-popper': {
    zIndex: 1300,
    marginTop: '4px',
  },
  '& .MuiAutocomplete-paper': {
    backgroundColor: colorMode === 'dark' ? '#111827' : '#ffffff',
    color: colorMode === 'dark' ? '#ffffff' : '#111827',
    border: `1px solid ${colorMode === 'dark' ? '#374151' : '#e5e7eb'}`,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  '& .MuiAutocomplete-listbox': {
    maxHeight: '200px',
    padding: 0,
  },
  '& .MuiAutocomplete-inputRoot': {
    padding: '6px 12px',
    color: colorMode === 'dark' ? '#ffffff' : '#111827',
  },
  '& .MuiAutocomplete-input': {
    padding: 0,
    color: colorMode === 'dark' ? '#ffffff' : '#111827',
  },
}));
