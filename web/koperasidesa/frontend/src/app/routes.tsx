import { createBrowserRouter } from "react-router";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import DashboardAnggota from "./components/DashboardAnggota";
import LihatInformasi from "./components/LihatInformasi";
import FormSimpanan from "./components/FormSimpanan";
import FormTarikSimpanan from "./components/FormTarikSimpanan";
import FormPengajuanPinjaman from "./components/FormPengajuanPinjaman";
import StatusPengajuanPinjaman from "./components/StatusPengajuanPinjaman";
import FormPembayaranAngsuran from "./components/FormPembayaranAngsuran";
import DashboardAdmin from "./components/DashboardAdmin";
import DataAnggota from "./components/DataAnggota";
import VerifikasiPinjaman from "./components/VerifikasiPinjaman";
import KelolaSimpanan from "./components/KelolaSimpanan";
import PembayaranAngsuranAdmin from "./components/PembayaranAngsuranAdmin";
import LaporanKeuangan from "./components/LaporanKeuangan";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/anggota/dashboard",
    Component: DashboardAnggota,
  },
  {
    path: "/anggota/informasi",
    Component: LihatInformasi,
  },
  {
    path: "/anggota/simpanan",
    Component: FormSimpanan,
  },
  {
    path: "/anggota/tarik-simpanan",
    Component: FormTarikSimpanan,
  },
  {
    path: "/anggota/pengajuan-pinjaman",
    Component: FormPengajuanPinjaman,
  },
  {
    path: "/anggota/status-pinjaman",
    Component: StatusPengajuanPinjaman,
  },
  {
    path: "/anggota/bayar-angsuran",
    Component: FormPembayaranAngsuran,
  },
  {
    path: "/admin/dashboard",
    Component: DashboardAdmin,
  },
  {
    path: "/admin/data-anggota",
    Component: DataAnggota,
  },
  {
    path: "/admin/verifikasi-pinjaman",
    Component: VerifikasiPinjaman,
  },
  {
    path: "/admin/kelola-simpanan",
    Component: KelolaSimpanan,
  },
  {
    path: "/admin/pembayaran-angsuran",
    Component: PembayaranAngsuranAdmin,
  },
  {
    path: "/admin/laporan",
    Component: LaporanKeuangan,
  },
]);
