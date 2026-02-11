import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function PageNotFound() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center">
      <div className="max-w-small mx-auto w-[90%]">
        <h1 className="mb-2 text-6xl font-bold leading-normal md:text-8xl">Oops!</h1>
        <div className="flex flex-col-reverse md:flex-row">
          <div className="w-full md:w-1/2">
            <p className="text-2xl font-medium leading-normal md:text-3xl">
              We can't seem to find the page <br /> you're looking for.
            </p>
            <p className="text-md mt-2 md:text-lg">Error code: 404</p>
            <Button
              className="mt-4"
              onClick={() =>
                navigate({
                  to: "/",
                })
              }
            >
              Go to home
            </Button>
          </div>
          {}
        </div>
      </div>
    </main>
  );
}
