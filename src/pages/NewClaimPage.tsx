import Header from '../components/Layout/Header';
import ClaimForm from '../components/ClaimForm/ClaimForm';

export default function NewClaimPage() {
  return (
    <div>
      <Header
        title="Submit New Claim"
        subtitle="Complete all steps to file a shipping claim"
      />
      <div className="px-8 py-6">
        <ClaimForm />
      </div>
    </div>
  );
}
