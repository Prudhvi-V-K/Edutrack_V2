import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function CourseCard({
  title,
  description,
  image,
  color,
  href,
}) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl border border-slate-200 dark:border-slate-800">
      
      <div className="relative h-48 w-full">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      <CardContent className="p-2 space-y-2 ml-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {description}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          asChild
          className={`w-full bg-gradient-to-r ${color} hover:opacity-90 text-white font-medium`}
        >
          <Link href={href}>Start Learning</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
