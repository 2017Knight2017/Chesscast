import { LoginForm } from '@/components/login_form';

export default function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-r from-[#f4ead5] to-[#e0c097]">
			<LoginForm isRegister={false}/>
		</div>
	);
}