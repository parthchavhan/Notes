import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";

export default async function SuccessPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user?.id) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        paymentDone: true,
      },
    });
  }

  return redirect("/dashboard");
} 