import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import './treasury.scss';

const accounts = [
  { label: 'Caja', name: 'Caja Principal', value: '€-240' },
  { label: 'Banco', name: 'Banco Santander', value: '€3,361' },
];

export default function Accounts() {
  return (
    <section className="app-page">
      <PageHeader
        title="Cuentas"
        subtitle="Gestión de cuentas de caja y banco"
        actions={<PrimaryButton label="Nueva cuenta" />}
      />

      <div className="accounts-grid">
        {accounts.map((account) => (
          <article className="account-card" key={account.name}>
            <div className="account-card__icon" aria-hidden="true">
              $
            </div>
            <p className="account-card__label">{account.label}</p>
            <p className="account-card__name">{account.name}</p>
            <p className="account-card__label">Saldo</p>
            <p className="account-card__value">{account.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
