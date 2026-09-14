export default function HospitalRow({ hospital, lang }) {
  const name = lang === "ar" ? hospital.name_ar : hospital.name_en;
  const gov = lang === "ar" ? hospital.gov_ar : hospital.gov_en;
  const services = lang === "ar" ? hospital.services_ar : hospital.services_en;
  const accreditation = lang === "ar" ? hospital.accreditation_ar : hospital.accreditation_en;

  return (
    <div className="hospital-row">
      <div>
        <h3>{name}</h3>
        <p className="hospital-meta">{gov}</p>
        <p className="hospital-meta">{services}</p>
        <p className="hospital-meta">{accreditation}</p>
      </div>
    </div>
  );
}
