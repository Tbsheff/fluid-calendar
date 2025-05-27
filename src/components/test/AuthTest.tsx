"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { trpc } from "@/lib/trpc/client";

/**
 * Test component for Auth tRPC procedures
 * This component tests the migrated auth functionality
 */
export function AuthTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  // tRPC query for isAdmin
  const isAdminQuery = trpc.auth.isAdmin.useQuery(undefined, {
    // `enabled: false` means it won't run on mount, only when `refetch` is called.
    // For a real-world scenario, you might want it enabled based on session status.
    enabled: false,
  });

  const addResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testIsAdmin = async () => {
    try {
      // Refetch will execute the query
      const result = await isAdminQuery.refetch();
      if (result.data) {
        addResult(
          `✅ Is admin status: ${result.data.isAdmin ? "Admin" : "Not admin"}`
        );
      } else if (result.error) {
        addResult(
          `❌ Is admin status failed: ${result.error.message}`
        );
      } else {
        addResult("❌ Is admin status: No data or error returned");
      }
    } catch (error) {
      // This catch block might be redundant if tRPC handles errors and puts them in result.error
      addResult(
        `❌ Is admin status failed (catch): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult("🚀 Starting Auth tRPC tests...");

    await testIsAdmin();
    // Add other auth tests here if needed

    addResult("✨ Auth tRPC tests completed!");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Auth tRPC Test Component</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the migrated auth tRPC procedures
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={runAllTests}
            disabled={isAdminQuery.isFetching}
          >
            {isAdminQuery.isFetching ? "Testing..." : "Run All Tests"}
          </Button>
          <Button
            onClick={testIsAdmin}
            variant="outline"
            disabled={isAdminQuery.isFetching}
          >
            Test Is Admin Status
          </Button>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            <strong>Available Auth Procedures:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <code>trpc.auth.isAdmin</code> - Check if current user has admin role
            </li>
            <li>
              <code>trpc.auth.getPublicSignupStatus</code> - Check if public signup is enabled
            </li>
            <li>
              <code>trpc.auth.register</code> - Register a new user
            </li>
            <li>
              <code>trpc.auth.requestPasswordReset</code> - Request password reset
            </li>
            <li>
              <code>trpc.auth.resetPassword</code> - Reset password with token
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
