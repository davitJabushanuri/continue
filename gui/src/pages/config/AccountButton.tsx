import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "../../components/ui";
import { useArchitechAuth } from "../../context/ArchitechAuth";

export function AccountButton() {
  const { user, isAuthenticated, logout, isLoading } = useArchitechAuth();
  const navigate = useNavigate();

  console.log("AccountButton render:", { 
    user, 
    isAuthenticated, 
    isLoading,
    userExists: !!user,
    tokenExists: !!user 
  });

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className="mb-1 whitespace-nowrap py-1"
        disabled
      >
        Loading...
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        className="mb-1 whitespace-nowrap py-1"
        onClick={() => navigate("/")}
      >
        Sign in
      </Button>
    );
  }

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          <PopoverButton className="bg-vsc-background hover:bg-vsc-input-background text-vsc-foreground my-0.5 flex cursor-pointer rounded-md border-none px-2">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {user.name || user.email}
              </span>
              <UserCircleIcon className="h-6 w-6" />
            </div>
          </PopoverButton>

          <Transition>
            <PopoverPanel className="bg-vsc-input-background xs:p-4 absolute right-0 mt-1 rounded-md border border-zinc-700 p-2 shadow-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="font-medium">{user.name || user.email}</span>
                  <span className="text-lightgray text-sm">
                    {user.email}
                  </span>
                  {user.subscription && (
                    <span className="text-lightgray text-xs">
                      {user.subscription.plan} ({user.subscription.status})
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    close();
                  }}
                  className="!mx-0 w-full"
                >
                  Sign out
                </Button>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
