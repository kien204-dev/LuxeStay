import React from "react";

function Table({ data }) {
  return (
    <table className="w-full text-left border-collapse">

      <thead>
        <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
          <th className="p-3 border-b">User</th>
          <th className="p-3 border-b">Email</th>
          <th className="p-3 border-b">Role</th>
          <th className="p-3 border-b">Status</th>
          <th className="p-3 border-b">Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((user) => (
          <tr
            key={user.id}
            className="hover:bg-gray-100 transition duration-200"
          >
            {/* Avatar + Name */}
            <td className="p-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
                {user.name}
              </div>
            </td>

            <td className="p-3 border-b">{user.email}</td>
            <td className="p-3 border-b">{user.role}</td>

            {/* Status */}
            <td className="p-3 border-b">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.status}
              </span>
            </td>

            {/* Actions */}
            <td className="p-3 border-b">
              <div className="flex gap-2">

                <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                  Edit
                </button>

                <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                  Delete
                </button>

              </div>
            </td>

          </tr>
        ))}
      </tbody>

    </table>
  );
}

export default Table;