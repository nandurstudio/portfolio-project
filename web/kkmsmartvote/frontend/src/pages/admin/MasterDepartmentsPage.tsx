export default function MasterDepartmentsPage() {
    return (
        <section className="admin-simple-card">
            <h2>Master Dept</h2>
            <p>
                Modul departemen disiapkan untuk mapping anggota dan kandidat.
                Endpoint CRUD department dapat dihubungkan di tahap berikutnya.
            </p>

            <div className="admin-note-box">
                <p><strong>Roadmap:</strong> list, tambah, edit, nonaktifkan department.</p>
                <p><strong>Status:</strong> UI siap, menunggu endpoint final backend.</p>
            </div>
        </section>
    )
}
