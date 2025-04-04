import FormulationUpload from '@/components/formulations/FormulationUpload';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Upload Formulation</h1>
          <p className="mt-2 text-lg text-gray-600">
            Submit your cosmetic formulation for Australia and New Zealand compliance review
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Prepare your formulation in an Excel file (.xlsx or .xls format)</li>
            <li>Include columns for INCI Name, CAS Number, Concentration (%), and Function</li>
            <li>Ensure all ingredients are listed with their correct INCI names</li>
            <li>Concentration values should be expressed as percentages (0-100)</li>
            <li>The total concentration should sum to approximately 100%</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Your formulation will be reviewed for compliance with Australian and New Zealand regulations.
            A detailed report will be provided upon completion of the review.
          </p>
        </div>
        
        <FormulationUpload />
      </div>
    </div>
  );
}
