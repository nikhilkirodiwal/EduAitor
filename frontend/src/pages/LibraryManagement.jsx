import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";


const LibraryManagement = () => {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalTitles: 0,
    totalAvailable: 0,
    lowStock: 0,
    totalcategory: 0,
  });

  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);

  const [addBookForm, setAddBookForm] = useState({
    title: '',
    author: '',
    category: '',
    isbn: '',
    totalCopies: 1,
  });

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    dueDate: '',
  });
  const API = import.meta.env.VITE_API_URL;

  const getSchoolId = () => JSON.parse(localStorage.getItem("userData"))?.school_id;


  useEffect(() => {
    fetchBooks();
    fetchStudents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBooks = async () => {
      const schoolId = getSchoolId();
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/library/books?schoolId=${schoolId}&search=${encodeURIComponent(searchTerm)}`
      );
      const data = res.data || [];
      setBooks(data);
      calculateStats(data, students);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
      const schoolId = getSchoolId();

    try {
     const res = await axios.get(`${API}/students`, {
        params: { schoolId },
      });
      setStudents(res.data.data);
      console.log(res.data.data)
      calculateStats(books);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const calculateStats = (bookData) => {
    const totalTitles = bookData.length;
    const totalAvailable = bookData.reduce(
      (acc, book) => acc + (book.availableCopies || 0),
      0
    );
    const lowStock = bookData.filter((book) => (book.availableCopies || 0) < 2)
      .length;

    setStats({
      totalTitles,
      totalAvailable,
      lowStock,
      totalcategory: 4 || 0,
    });
  };

  const handleAddBookChange = (e) => {
  const { name, value } = e.target;
  setAddBookForm((prev) => ({
    ...prev,
    [name]: name === 'totalCopies' ? Number(value) : value,
  }));
};

  const handleIssueChange = (e) => {
    const { name, value } = e.target;
    setIssueForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 const handleAddBook = async (e) => {
  e.preventDefault();
  setLoading(true);
  const schoolId = getSchoolId(); // Ensure this pulls your Object ID
    const loadingToast = toast.loading("Processing payment...");

  try {
    await axios.post(`${API}/library/add/books`, {
      ...addBookForm,
      schoolId,
      availableCopies: Number(addBookForm.totalCopies), // Sync on creation
    });
     toast.dismiss(loadingToast);
    // Reset and Close
    setAddBookForm({ title: '', author: '', category: '', isbn: '', totalCopies: 1 });
    setShowAddModal(false);
    fetchBooks(); // Refresh the list
  } catch (error) {
     toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Something went wrong");
  } finally {
    setLoading(false);
        toast.success(`📚book added succesfully`);

  }
};

  const openIssueModal = (book) => {
    setSelectedBook(book);
    setIssueForm({
      studentId: '',
      dueDate: '',
    });
    setShowIssueModal(true);
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();

    if (!selectedBook) return;
          const schoolId = getSchoolId();
    try {
      await axios.post(`${API}/library/book/issues`, {
        schoolId,
        bookId: selectedBook._id,
        studentId: issueForm.studentId,
        dueDate: issueForm.dueDate,
      });

      setShowIssueModal(false);
      setSelectedBook(null);
      setIssueForm({
        studentId: '',
        dueDate: '',
      });

      fetchBooks();
    } catch (error) {
      console.error('Error issuing book:', error);
      alert(error?.response?.data?.error || 'Failed to issue book');
    }
  };

  const handleReturnBook = async (book) => {
    const issueId = prompt(`Enter issue record ID for "${book.title}" return`);
    if (!issueId) return;

    try {
      const res = await axios.post('/api/books/return', { issueId });
      alert(
        `Book returned successfully${
          res.data?.lateFee ? `. Late fee: ₹${res.data.lateFee}` : ''
        }`
      );
      fetchBooks();
    } catch (error) {
      console.error('Error returning book:', error);
      alert(error?.response?.data?.error || 'Failed to return book');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Library Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage books, issue records, and returns .
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Books" value={stats.totalTitles} color="blue" />
          <StatCard
            title="Available Copies"
            value={stats.totalAvailable}
            color="green"
          />
          <StatCard title="Low Stock" value={stats.lowStock} color="red" />
          <StatCard
            title="Category"
            value={stats.totalcategory}
            color="purple"
          />
        </div>

        <div className="mb-5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ISBN"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Book
              </button>
              <button
                onClick={() => fetchBooks()}
                className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr className="text-left text-sm text-slate-700">
                  <th className="px-5 py-4 font-semibold">Book</th>
                  <th className="px-5 py-4 font-semibold">ISBN</th>
                  <th className="px-5 py-4 font-semibold">Stock</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.length > 0 ? (
                  books.map((book) => (
                    <tr key={book._id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {book.title}
                        </p>
                        <p className="text-sm text-slate-500">{book.author}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {book.isbn}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {book.availableCopies} / {book.totalCopies}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge availableCopies={book.availableCopies} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openIssueModal(book)}
                            disabled={book.availableCopies < 1}
                            className={`rounded-lg px-3 py-2 text-sm font-medium ${
                              book.availableCopies < 1
                                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            Issue
                          </button>
                          <button
                            onClick={() => handleReturnBook(book)}
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      {loading ? 'Loading books...' : 'No books found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {books.length > 0 ? (
              books.map((book) => (
                <div key={book._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{book.author}</p>
                    </div>
                    <StatusBadge availableCopies={book.availableCopies} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">ISBN</p>
                      <p className="mt-1 break-words font-medium text-slate-800">
                        {book.isbn}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">Stock</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {book.availableCopies} / {book.totalCopies}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openIssueModal(book)}
                      disabled={book.availableCopies < 1}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                        book.availableCopies < 1
                          ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Issue
                    </button>
                    <button
                      onClick={() => handleReturnBook(book)}
                      className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Return
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                {loading ? 'Loading books...' : 'No books found'}
              </div>
            )}
          </div>
        </div>
      </div>

     {showAddModal && (
  <ModalWrapper onClose={() => setShowAddModal(false)}>
    <div className="rounded-2xl bg-white p-4 sm:p-8 max-w-2xl w-full mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Add New Book</h2>
        <p className="text-sm text-slate-500">Inventory update for school library</p>
      </div>

      <form onSubmit={handleAddBook} className="space-y-4">
        {/* Title Field */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Book Title</label>
          <input
            type="text"
            name="title"
            value={addBookForm.title}
            onChange={handleAddBookChange}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            placeholder="e.g. The Great Gatsby"
          />
        </div>

        {/* Row 1: Author & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Author</label>
            <input
              type="text"
              name="author"
              value={addBookForm.author}
              onChange={handleAddBookChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
            <select
              name="category"
              value={addBookForm.category}
              onChange={handleAddBookChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
            >
              <option value="">Select Category</option>
              <option value="Fiction">Fiction</option>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="History">History</option>
            </select>
          </div>
        </div>

        {/* Row 2: ISBN & Total Copies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">ISBN</label>
            <input
              type="text"
              name="isbn"
              value={addBookForm.isbn}
              onChange={handleAddBookChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="ISBN Number"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Total Copies</label>
            <input
              type="number"
              name="totalCopies"
              min="1"
              value={addBookForm.totalCopies}
              onChange={handleAddBookChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Adding...' : 'Save to Library'}
          </button>
        </div>
      </form>
    </div>
  </ModalWrapper>
)}

      {showIssueModal && selectedBook && (
        <ModalWrapper
          onClose={() => {
            setShowIssueModal(false);
            setSelectedBook(null);
          }}
        >
          <div className="rounded-2xl bg-white p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Issue Book</h2>
              <p className="mt-1 text-sm text-slate-500">
                Assign this book to a student.
              </p>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-4">
              <p className="text-base font-semibold text-slate-900">
                {selectedBook.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedBook.author}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Available Copies: {selectedBook.availableCopies}
              </p>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Select Student
                </label>
                <select
                  name="studentId"
                  value={issueForm.studentId}
                  onChange={handleIssueChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.class ? `- ${student.class}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={issueForm.dueDate}
                  onChange={handleIssueChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueModal(false);
                    setSelectedBook(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-600',
    red: 'bg-rose-600',
    purple: 'bg-violet-600',
  };

  return (
    <div className={`${colorMap[color]} rounded-2xl p-4 text-white shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold sm:text-3xl">{value}</p>
    </div>
  );
};

const StatusBadge = ({ availableCopies }) => {
  if (availableCopies < 1) {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        Out of Stock
      </span>
    );
  }

  if (availableCopies < 2) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      In Stock
    </span>
  );
};

const ModalWrapper = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl sm:max-w-lg sm:rounded-2xl">
        {children}
      </div>
    </div>
  );
};

export default LibraryManagement;

// /* ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
// ==================================================================================================================
//   */

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const LibraryManagement = () => {
//   const [books, setBooks] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'returns'
//   const [issuedBooks, setIssuedBooks] = useState([]);
  
//   // Stats
//   const [stats, setStats] = useState({ totalTitles: 0, totalAvailable: 0, lowStock: 0, categories: 0 });

//   // Modals
//   const [showFormModal, setShowFormModal] = useState(false);
//   const [showIssueModal, setShowIssueModal] = useState(false);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

//   const [selectedBook, setSelectedBook] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   // Forms
//   const [bookForm, setBookForm] = useState({ title: '', author: '', category: '', isbn: '', totalCopies: 1 });
//   const [issueForm, setIssueForm] = useState({ studentId: '', dueDate: '' });

//   const API = import.meta.env.VITE_API_URL;
//   const getSchoolId = () => JSON.parse(localStorage.getItem("userData"))?.school_id;

//   useEffect(() => {
//     fetchBooks();
//     fetchStudents();
//     if (activeTab === 'returns') fetchIssuedRecords();
//   }, [activeTab]);

//   useEffect(() => {
//     const timer = setTimeout(fetchBooks, 400);
//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   const fetchBooks = async () => {
//     const schoolId = getSchoolId();
//     try {
//       const res = await axios.get(`${API}/library/books?schoolId=${schoolId}&search=${encodeURIComponent(searchTerm)}`);
//       setBooks(res.data || []);
//       calculateStats(res.data || []);
//     } catch (error) { toast.error("Error fetching library"); }
//   };

//   const fetchIssuedRecords = async () => {
//     try {
//       const res = await axios.get(`${API}/library/book/issues?schoolId=${getSchoolId()}`);
//       setIssuedBooks(res.data || []);
//     } catch (error) { toast.error("Could not load issued records"); }
//   };

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get(`${API}/students`, { params: { schoolId: getSchoolId() } });
//       setStudents(res.data.data);
//     } catch (error) { console.error(error); }
//   };

//   const calculateStats = (data) => {
//     setStats({
//       totalTitles: data.length,
//       totalAvailable: data.reduce((acc, b) => acc + (b.availableCopies || 0), 0),
//       lowStock: data.filter(b => b.availableCopies < 2).length,
//       categories: new Set(data.map(b => b.category)).size
//     });
//   };

//   const handleSaveBook = async (e) => {
//     e.preventDefault();
//     const loadId = toast.loading(isEditing ? "Updating..." : "Adding Book...");
//     try {
//       const url = isEditing ? `${API}/library/books/${selectedBook._id}` : `${API}/library/add/books`;
//       const method = isEditing ? 'put' : 'post';
      
//       await axios[method](url, { 
//         ...bookForm, 
//         schoolId: getSchoolId(),
//         availableCopies: isEditing ? selectedBook.availableCopies : bookForm.totalCopies 
//       });

//       toast.update(loadId, { render: "Success!", type: "success", isLoading: false, autoClose: 2000 });
//       closeModals();
//       fetchBooks();
//     } catch (error) {
//       toast.update(loadId, { render: error.response?.data?.error || "Action failed", type: "error", isLoading: false, autoClose: 2000 });
//     }
//   };

//   const handleDeleteBook = async () => {
//     try {
//       await axios.delete(`${API}/library/books/${selectedBook._id}?schoolId=${getSchoolId()}`);
//       toast.success("Book removed");
//       closeModals();
//       fetchBooks();
//     } catch (error) { toast.error("Delete failed"); }
//   };

//   const handleIssueBook = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post(`${API}/library/book/issues`, {
//         schoolId: getSchoolId(),
//         bookId: selectedBook._id,
//         ...issueForm
//       });
//       toast.success("Book issued successfully");
//       closeModals();
//       fetchBooks();
//     } catch (error) { toast.error(error.response?.data?.error || "Issue failed"); }
//   };

//   const handleReturn = async (issueId) => {
//     try {
//       await axios.post(`${API}/library/book/return`, { issueId });
//       toast.success("Returned successfully");
//       fetchIssuedRecords();
//       fetchBooks();
//     } catch (error) { toast.error("Return failed"); }
//   };

//   const closeModals = () => {
//     setShowFormModal(false);
//     setShowIssueModal(false);
//     setShowDetailsModal(false);
//     setShowDeleteConfirm(false);
//     setIsEditing(false);
//     setSelectedBook(null);
//     setBookForm({ title: '', author: '', category: '', isbn: '', totalCopies: 1 });
//   };

//   const openEdit = () => {
//     setBookForm({ ...selectedBook });
//     setIsEditing(true);
//     setShowDetailsModal(false);
//     setShowFormModal(true);
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 pb-20">
//       <ToastContainer />
      
//       {/* Header */}
//       <div className="bg-white border-b border-slate-200 px-4 py-6 mb-6">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-black text-slate-900 tracking-tight">SCHOOL LIBRARY</h1>
//             <p className="text-slate-500 text-sm">Inventory & Circulation Management</p>
//           </div>
//           <button onClick={() => setShowFormModal(true)} className="hidden sm:block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100">+ Add Book</button>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4">
//         {/* Stats Grid */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
//           <StatCard title="Total Titles" value={stats.totalTitles} icon="📚" color="blue" />
//           <StatCard title="Available" value={stats.totalAvailable} icon="✅" color="green" />
//           <StatCard title="Low Stock" value={stats.lowStock} icon="⚠️" color="red" />
//           <StatCard title="Categories" value={stats.categories} icon="📂" color="purple" />
//         </div>

//         {/* Search & Tabs */}
//         <div className="bg-white rounded-2xl p-2 mb-6 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
//             <div className="flex bg-slate-100 p-1 rounded-xl">
//                 <button onClick={() => setActiveTab('inventory')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Inventory</button>
//                 <button onClick={() => setActiveTab('returns')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'returns' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Returns</button>
//             </div>
//             <input 
//                 className="flex-1 px-4 py-2 rounded-xl border-none bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500" 
//                 placeholder={activeTab === 'inventory' ? "Search books..." : "Search student or book..."}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <button onClick={() => setShowFormModal(true)} className="sm:hidden bg-blue-600 text-white py-3 rounded-xl font-bold">+ Add Book</button>
//         </div>

//         {/* Content Area */}
//         {activeTab === 'inventory' ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {books.map(book => (
//               <BookCard 
//                 key={book._id} 
//                 book={book} 
//                 onIssue={() => { setSelectedBook(book); setShowIssueModal(true); }}
//                 onDetails={() => { setSelectedBook(book); setShowDetailsModal(true); }}
//               />
//             ))}
//           </div>
//         ) : (
//           <ReturnsList records={issuedBooks} onReturn={handleReturn} />
//         )}
//       </div>

//       {/* --- MODALS --- */}
//       {showFormModal && (
//         <ModalWrapper onClose={closeModals} title={isEditing ? "Update Book" : "New Library Entry"}>
//             <form onSubmit={handleSaveBook} className="space-y-4 p-4">
//                 <Input label="Book Name" value={bookForm.title} onChange={v => setBookForm({...bookForm, title: v})} />
//                 <div className="grid grid-cols-2 gap-3">
//                     <Input label="Author" value={bookForm.author} onChange={v => setBookForm({...bookForm, author: v})} />
//                     <Select label="Category" value={bookForm.category} options={['Fiction', 'Science', 'Math', 'History']} onChange={v => setBookForm({...bookForm, category: v})} />
//                 </div>
//                 <div className="grid grid-cols-2 gap-3">
//                     <Input label="ISBN" value={bookForm.isbn} onChange={v => setBookForm({...bookForm, isbn: v})} />
//                     <Input label="Total Stock" type="number" value={bookForm.totalCopies} onChange={v => setBookForm({...bookForm, totalCopies: v})} />
//                 </div>
//                 <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black mt-4">SAVE DATA</button>
//             </form>
//         </ModalWrapper>
//       )}

//       {showIssueModal && (
//         <ModalWrapper onClose={closeModals} title="Issue Book">
//             <div className="p-4">
//                 <div className="bg-blue-50 p-4 rounded-xl mb-4 text-blue-800 font-bold">{selectedBook?.title}</div>
//                 <form onSubmit={handleIssueBook} className="space-y-4">
//                     <select className="w-full p-4 rounded-xl border bg-slate-50" required onChange={e => setIssueForm({...issueForm, studentId: e.target.value})}>
//                         <option value="">Select Student</option>
//                         {students.map(s => <option key={s._id} value={s._id}>{s.firstName} - {s.class}</option>)}
//                     </select>
//                     <Input label="Return Due Date" type="date" onChange={v => setIssueForm({...issueForm, dueDate: v})} />
//                     <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">CONFIRM ISSUE</button>
//                 </form>
//             </div>
//         </ModalWrapper>
//       )}

//       {showDetailsModal && (
//         <ModalWrapper onClose={closeModals} title="Book Control Center">
//             <div className="p-6">
//                 <div className="border-b pb-4 mb-4">
//                     <p className="text-xs font-bold text-blue-600 uppercase mb-1">{selectedBook?.category}</p>
//                     <h3 className="text-xl font-black text-slate-800">{selectedBook?.title}</h3>
//                     <p className="text-slate-500 font-medium italic">by {selectedBook?.author}</p>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4 mb-8">
//                     <DetailBox label="ISBN" value={selectedBook?.isbn} />
//                     <DetailBox label="Availability" value={`${selectedBook?.availableCopies} / ${selectedBook?.totalCopies}`} />
//                 </div>
//                 <div className="flex gap-2">
//                     <button onClick={openEdit} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold">Edit Details</button>
//                     <button onClick={() => setShowDeleteConfirm(true)} className="px-4 bg-red-50 text-red-600 rounded-xl">🗑️</button>
//                 </div>
//             </div>
//         </ModalWrapper>
//       )}

//       {showDeleteConfirm && (
//         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
//             <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center">
//                 <div className="text-3xl mb-2">⚠️</div>
//                 <h3 className="font-bold text-lg mb-1 text-slate-900">Confirm Delete?</h3>
//                 <p className="text-slate-500 text-sm mb-6">This will remove this book and all its history permanently.</p>
//                 <div className="flex gap-2">
//                     <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 text-slate-400 font-bold">Cancel</button>
//                     <button onClick={handleDeleteBook} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold">Delete</button>
//                 </div>
//             </div>
//         </div>
//       )}
//     </div>
//   );
// };

// /* --- UI HELPERS --- */

// const BookCard = ({ book, onIssue, onDetails }) => (
//   <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
//     <div className="flex justify-between items-start mb-4">
//       <div className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase">{book.category}</div>
//       <StatusBadge val={book.availableCopies} />
//     </div>
//     <h3 className="font-bold text-slate-800 text-lg truncate mb-1">{book.title}</h3>
//     <p className="text-slate-500 text-sm italic mb-4">by {book.author}</p>
//     <div className="flex justify-between items-center border-t pt-4">
//       <div className="text-xs text-slate-400">Stock: <span className="text-slate-800 font-bold">{book.availableCopies}/{book.totalCopies}</span></div>
//       <div className="flex gap-1">
//         <button onClick={onIssue} disabled={book.availableCopies < 1} className="text-blue-600 font-bold text-sm px-3 py-1.5 hover:bg-blue-50 rounded-lg disabled:opacity-30">Issue</button>
//         <button onClick={onDetails} className="bg-slate-100 text-slate-700 font-bold text-sm px-3 py-1.5 rounded-lg">Details</button>
//       </div>
//     </div>
//   </div>
// );

// const ReturnsList = ({ records, onReturn }) => (
//     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
//         {records.length === 0 ? <div className="p-10 text-center text-slate-400">No active issues found</div> : (
//             <div className="divide-y divide-slate-100">
//                 {records.map(rec => (
//                     <div key={rec._id} className="p-4 flex justify-between items-center hover:bg-slate-50">
//                         <div>
//                             <p className="font-bold text-slate-800 text-sm">{rec.bookId?.title}</p>
//                             <p className="text-xs text-slate-500">Issued to: <span className="font-bold">{rec.studentId?.firstName}</span></p>
//                         </div>
//                         <div className="flex items-center gap-4">
//                             <p className="text-[10px] font-bold text-red-500">Due: {new Date(rec.dueDate).toLocaleDateString()}</p>
//                             <button onClick={() => onReturn(rec._id)} className="bg-emerald-50 text-emerald-600 text-xs px-3 py-2 rounded-lg font-bold">RETURN</button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         )}
//     </div>
// );

// const ModalWrapper = ({ children, onClose, title }) => (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
//         <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
//             <div className="flex justify-between items-center p-4 border-b">
//                 <h2 className="font-black text-slate-800">{title}</h2>
//                 <button onClick={onClose} className="text-slate-300 hover:text-slate-600">✕</button>
//             </div>
//             {children}
//         </div>
//     </div>
// );

// const StatCard = ({ title, value, color, icon }) => {
//   const colors = { blue: 'text-blue-600 bg-blue-50', green: 'text-emerald-600 bg-emerald-50', red: 'text-red-600 bg-red-50', purple: 'text-purple-600 bg-purple-50' };
//   return (
//     <div className={`p-4 rounded-2xl border border-slate-100 shadow-sm bg-white`}>
//       <div className="flex justify-between items-center mb-2">
//         <span className="text-xl">{icon}</span>
//         <span className={`text-xs font-black uppercase tracking-widest opacity-60`}>{title}</span>
//       </div>
//       <p className="text-2xl font-black text-slate-800">{value}</p>
//     </div>
//   );
// };

// const Input = ({ label, type = "text", value, onChange }) => (
//     <div>
//         <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">{label}</label>
//         <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" required />
//     </div>
// );

// const Select = ({ label, value, options, onChange }) => (
//     <div>
//         <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">{label}</label>
//         <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none" required>
//             <option value="">Select</option>
//             {options.map(o => <option key={o} value={o}>{o}</option>)}
//         </select>
//     </div>
// );

// const StatusBadge = ({ val }) => {
//   const color = val === 0 ? 'bg-red-50 text-red-600' : val < 3 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600';
//   const text = val === 0 ? 'Out' : val < 3 ? 'Low' : 'Good';
//   return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${color}`}>{text}</span>;
// }

// const DetailBox = ({ label, value }) => (
//     <div className="bg-slate-50 p-3 rounded-xl">
//         <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
//         <p className="font-bold text-slate-800">{value}</p>
//     </div>
// );

// export default LibraryManagement;