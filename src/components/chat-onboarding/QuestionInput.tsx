import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type QuestionType = 'text' | 'number' | 'select' | 'radio' | 'checkbox-group' | 'time';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionConfig {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  options?: QuestionOption[];
  required?: boolean;
  conditionalOn?: {
    fieldId: string;
    value: string | string[];
  };
}

interface QuestionInputProps {
  question: QuestionConfig;
  value: any;
  onChange: (value: any) => void;
  onSubmit: () => void;
  isValid: boolean;
  allValues?: Record<string, any>;
}

export function QuestionInput({
  question,
  value,
  onChange,
  onSubmit,
  isValid,
  allValues = {},
}: QuestionInputProps) {
  // Check if this question should be shown based on conditional logic
  const shouldShow = () => {
    if (!question.conditionalOn) return true;
    const dependentValue = allValues[question.conditionalOn.fieldId];
    if (Array.isArray(question.conditionalOn.value)) {
      return question.conditionalOn.value.includes(dependentValue);
    }
    return dependentValue === question.conditionalOn.value;
  };

  if (!shouldShow()) return null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && question.type === 'text') {
      onSubmit();
    }
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={question.placeholder}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              autoFocus
            />
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder={question.placeholder}
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
              className="w-full"
              autoFocus
            />
          </div>
        );

      case 'time':
        return (
          <div className="flex flex-col gap-3">
            <Label htmlFor="time-picker" className="px-1">
              Time
            </Label>
            <Input
              type="time"
              id="time-picker"
              step="1"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              autoFocus
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={question.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox-group':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isChecked = Array.isArray(value) && value.includes(option.value);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        onChange([...currentValues, option.value]);
                      } else {
                        onChange(currentValues.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 py-3">
      {/* Add left padding to account for avatar (40px) + gap (8px) + container padding (64px mobile, 96px desktop) */}
      <div className="pl-[112px] pr-16 md:pl-[144px] md:pr-24">
        {renderInput()}
        <Button onClick={onSubmit} disabled={!isValid} className="w-full mt-4">
          Continue
        </Button>
      </div>
    </div>
  );
}
