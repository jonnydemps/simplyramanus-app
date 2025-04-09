import * as XLSX from 'xlsx';

// Define the expected structure of an ingredient row in the Excel file
interface IngredientRow {
  INCI_Name?: string;
  'INCI Name'?: string;
  Ingredient?: string;
  CAS_Number?: string;
  'CAS Number'?: string;
  CAS?: string;
  Concentration?: number;
  'Concentration (%)'?: number;
  Percentage?: number;
  Function?: string;
  Purpose?: string;
  Role?: string;
  [key: string]: string | number | boolean | null | undefined; // Allow for other properties with basic types
}

// Function to extract ingredients from Excel file
export const extractIngredientsFromExcel = (buffer: ArrayBuffer): { 
  ingredients: Array<{
    inci_name: string;
    cas_number?: string;
    concentration: number;
    function?: string;
  }>;
  errors: string[];
} => {
  const errors: string[] = [];
  const ingredients: Array<{
    inci_name: string;
    cas_number?: string;
    concentration: number;
    function?: string;
  }> = [];

  try {
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json<IngredientRow>(worksheet);
    
    if (!data || data.length === 0) {
      errors.push('Excel file is empty or has invalid format');
      return { ingredients, errors };
    }

    // Analyze the first row to determine column mapping
    const firstRow = data[0];
    const headers = Object.keys(firstRow);

    // Determine which columns to use for each property
    const inciNameKey = headers.find(h => 
      /inci.*name/i.test(h) || h.toLowerCase() === 'ingredient'
    );
    
    const casNumberKey = headers.find(h => 
      /cas.*number/i.test(h) || h.toLowerCase() === 'cas'
    );
    
    const concentrationKey = headers.find(h => 
      /concentration/i.test(h) || /percentage/i.test(h) || /%/i.test(h)
    );
    
    const functionKey = headers.find(h => 
      /function/i.test(h) || /purpose/i.test(h) || /role/i.test(h)
    );

    if (!inciNameKey) {
      errors.push('Could not find INCI Name column in Excel file');
      return { ingredients, errors };
    }

    if (!concentrationKey) {
      errors.push('Could not find Concentration column in Excel file');
      return { ingredients, errors };
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const inci_name = row[inciNameKey]?.toString().trim();
      
      if (!inci_name) {
        errors.push(`Row ${i + 2}: Missing INCI Name`);
        continue;
      }

      const concentration = parseFloat(row[concentrationKey]?.toString() || '0');
      if (isNaN(concentration)) {
        errors.push(`Row ${i + 2}: Invalid concentration value for ${inci_name}`);
        continue;
      }

      const ingredient = {
        inci_name,
        concentration,
        cas_number: casNumberKey ? row[casNumberKey]?.toString().trim() : undefined,
        function: functionKey ? row[functionKey]?.toString().trim() : undefined
      };

      ingredients.push(ingredient);
    }

    return { ingredients, errors };
  } catch (error) {
    errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`);
    return { ingredients, errors };
  }
};

// Function to validate the extracted ingredients
export const validateIngredients = (ingredients: Array<{
  inci_name: string;
  cas_number?: string;
  concentration: number;
  function?: string;
}>): string[] => {
  const errors: string[] = [];

  // Check if there are any ingredients
  if (ingredients.length === 0) {
    errors.push('No ingredients found in the formulation');
    return errors;
  }

  // Validate each ingredient
  ingredients.forEach((ingredient, index) => {
    // Check for required fields
    if (!ingredient.inci_name) {
      errors.push(`Ingredient ${index + 1}: Missing INCI name`);
    }

    // Validate concentration is between 0 and 100
    if (ingredient.concentration < 0 || ingredient.concentration > 100) {
      errors.push(`Ingredient ${index + 1} (${ingredient.inci_name}): Concentration must be between 0 and 100%`);
    }
  });

  // Check if total concentration is approximately 100%
  const totalConcentration = ingredients.reduce((sum, ingredient) => sum + ingredient.concentration, 0);
  if (totalConcentration < 95 || totalConcentration > 105) {
    errors.push(`Total concentration (${totalConcentration.toFixed(2)}%) is not approximately 100%. Please check your formulation.`);
  }

  return errors;
};
