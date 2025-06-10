import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

interface ReportData {
  type: string
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  departments: string[]
  data: any
}

export class ReportGenerator {
  static async generatePDF(reportData: ReportData): Promise<Blob> {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text("Enterprise Management System", 20, 20)
    doc.setFontSize(16)
    doc.text(`${reportData.type.toUpperCase()} REPORT`, 20, 35)

    // Date range
    doc.setFontSize(12)
    const fromDate = reportData.dateRange.from?.toLocaleDateString() || "N/A"
    const toDate = reportData.dateRange.to?.toLocaleDateString() || "N/A"
    doc.text(`Report Period: ${fromDate} - ${toDate}`, 20, 50)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 60)

    // Summary statistics
    let yPosition = 80
    doc.setFontSize(14)
    doc.text("Summary Statistics", 20, yPosition)
    yPosition += 15

    doc.setFontSize(11)
    doc.text(`Total Files: ${reportData.data.totalFiles}`, 20, yPosition)
    yPosition += 10
    doc.text(`Total Requests: ${reportData.data.totalRequests}`, 20, yPosition)
    yPosition += 10
    doc.text(`Pending Approvals: ${reportData.data.pendingApprovals}`, 20, yPosition)
    yPosition += 10
    doc.text(`Completed This Month: ${reportData.data.completedThisMonth}`, 20, yPosition)
    yPosition += 20

    // Department statistics table
    doc.setFontSize(14)
    doc.text("Department Statistics", 20, yPosition)
    yPosition += 10

    const tableData = reportData.data.departmentStats.map((dept: any) => [
      dept.name,
      dept.files.toString(),
      dept.requests.toString(),
      dept.pending.toString(),
      dept.completed.toString(),
      `${((dept.completed / (dept.files + dept.requests)) * 100).toFixed(1)}%`,
    ])
    ;(doc as any).autoTable({
      head: [["Department", "Files", "Requests", "Pending", "Completed", "Success Rate"]],
      body: tableData,
      startY: yPosition,
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] }, // Orange theme
      styles: { fontSize: 10 },
    })

    // Status distribution
    yPosition = (doc as any).lastAutoTable.finalY + 20
    doc.setFontSize(14)
    doc.text("Status Distribution", 20, yPosition)
    yPosition += 15

    reportData.data.statusDistribution.forEach((status: any, index: number) => {
      doc.setFontSize(11)
      doc.text(`${status.name}: ${status.value}`, 20, yPosition + index * 10)
    })

    return new Blob([doc.output("blob")], { type: "application/pdf" })
  }

  static async generateExcel(reportData: ReportData): Promise<Blob> {
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ["Enterprise Management System Report"],
      [""],
      ["Report Type:", reportData.type.toUpperCase()],
      [
        "Date Range:",
        `${reportData.dateRange.from?.toLocaleDateString() || "N/A"} - ${reportData.dateRange.to?.toLocaleDateString() || "N/A"}`,
      ],
      ["Generated:", new Date().toLocaleDateString()],
      [""],
      ["SUMMARY STATISTICS"],
      ["Total Files:", reportData.data.totalFiles],
      ["Total Requests:", reportData.data.totalRequests],
      ["Pending Approvals:", reportData.data.pendingApprovals],
      ["Completed This Month:", reportData.data.completedThisMonth],
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

    // Department statistics sheet
    const deptHeaders = ["Department", "Files", "Requests", "Pending", "Completed", "Success Rate (%)"]
    const deptData = reportData.data.departmentStats.map((dept: any) => [
      dept.name,
      dept.files,
      dept.requests,
      dept.pending,
      dept.completed,
      ((dept.completed / (dept.files + dept.requests)) * 100).toFixed(1),
    ])

    const deptSheet = XLSX.utils.aoa_to_sheet([deptHeaders, ...deptData])
    XLSX.utils.book_append_sheet(workbook, deptSheet, "Department Stats")

    // Status distribution sheet
    const statusHeaders = ["Status", "Count"]
    const statusData = reportData.data.statusDistribution.map((status: any) => [status.name, status.value])

    const statusSheet = XLSX.utils.aoa_to_sheet([statusHeaders, ...statusData])
    XLSX.utils.book_append_sheet(workbook, statusSheet, "Status Distribution")

    // Monthly trends sheet
    const trendsHeaders = ["Month", "Files", "Requests"]
    const trendsData = reportData.data.monthlyTrend.map((trend: any) => [trend.month, trend.files, trend.requests])

    const trendsSheet = XLSX.utils.aoa_to_sheet([trendsHeaders, ...trendsData])
    XLSX.utils.book_append_sheet(workbook, trendsSheet, "Monthly Trends")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  }

  static downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
