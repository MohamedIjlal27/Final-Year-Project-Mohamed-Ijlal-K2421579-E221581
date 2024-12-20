import BlurPage from '@/components/global/blur-page'
import CircleProgress from '@/components/global/circle-progress'
import PipelineValue from '@/components/global/pipeline-value'
import SubaccountFunnelChart from '@/components/global/subaccount-funnel-chart'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TableHeader } from '@/components/ui/table'
import { db } from '@/lib/db'
import { AreaChart, BadgeDelta, TableBody, TableCell, TableHead, TableRow } from '@tremor/react'
import { ClipboardIcon, Contact2, DollarSign, ShoppingCart, Table } from 'lucide-react'
import Link from 'next/link'

type Props = {
  params: { subaccountId: string }
  searchParams: { code: string }
}

interface Transaction {
  id: string
  status: 'paid' | 'pending' | 'failed'
  created: string
  amount_total: number
  customer_details?: { email: string }
}

const SubaccountPageId = async ({ params }: Props) => {
  const currency = 'USD'
  const currentYear = new Date().getFullYear()

  const subaccountDetails = await db.subAccount.findUnique({
    where: { id: params.subaccountId },
  })

  if (!subaccountDetails) return

  // Mock transaction data instead of stripe
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      status: 'paid',
      created: new Date().toISOString(),
      amount_total: 2000,
      customer_details: { email: 'customer@example.com' },
    },
  ]

  const sessions = mockTransactions
  const totalClosedSessions = mockTransactions.filter(
    (session) => session.status === 'paid'
  )
  const totalPendingSessions = mockTransactions.filter(
    (session) => session.status === 'pending'
  )

  const net = totalClosedSessions.reduce(
    (total, session) => total + session.amount_total,
    0
  )
  const potentialIncome = totalPendingSessions.reduce(
    (total, session) => total + session.amount_total,
    0
  )
  const closingRate = (totalClosedSessions.length / sessions.length) * 100

  const funnels = await db.funnel.findMany({
    where: { subAccountId: params.subaccountId },
    include: { FunnelPages: true },
  })

  const funnelPerformanceMetrics = funnels.map((funnel) => ({
    ...funnel,
    totalFunnelVisits: funnel.FunnelPages.reduce(
      (total, page) => total + page.visits,
      0
    ),
  }))

  return (
    <BlurPage>
      <div className="relative h-full">
        {/*!subaccountDetails.connectAccountId && (
          <div className="absolute -top-10 -left-10 right-0 bottom-0 z-30 flex items-center justify-center backdrop-blur-md bg-background/50">
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Stripe</CardTitle>
                <CardDescription>
                  You need to connect your stripe account to see metrics
                </CardDescription>
                <Link
                  href={`/subaccount/${subaccountDetails.id}/launchpad`}
                  className="p-2 w-fit bg-secondary text-white rounded-md flex items-center gap-2"
                >
                  <ClipboardIcon />
                  Launch Pad
                </Link>
              </CardHeader>
            </Card>
          </div>
        )*/}
        <div className="flex flex-col gap-4 pb-6">
          <div className="flex gap-4 flex-col xl:!flex-row">
            <Card className="flex-1 relative">
              <CardHeader>
                <CardDescription>Income</CardDescription>
                <CardTitle className="text-4xl">
                  {net ? `${currency} ${net.toFixed(2)}` : `$0.00`}
                </CardTitle>
                <small className="text-xs text-muted-foreground">
                  For the year {currentYear}
                </small>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Total revenue generated as reflected in your stripe dashboard.
              </CardContent>
              <DollarSign className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
            <Card className="flex-1 relative">
              <CardHeader>
                <CardDescription>Potential Income</CardDescription>
                <CardTitle className="text-4xl">
                  {potentialIncome
                    ? `${currency} ${potentialIncome.toFixed(2)}`
                    : `$0.00`}
                </CardTitle>
                <small className="text-xs text-muted-foreground">
                  For the year {currentYear}
                </small>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                This is how much you can close.
              </CardContent>
              <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
            <PipelineValue subaccountId={params.subaccountId} />

            <Card className="xl:w-fit">
              <CardHeader>
                <CardDescription>Conversions</CardDescription>
                <CircleProgress
                  value={closingRate}
                  description={
                    <>
                      {sessions && (
                        <div className="flex flex-col">
                          Total Carts Opened
                          <div className="flex gap-2">
                            <ShoppingCart className="text-rose-700" />
                            {sessions.length}
                          </div>
                        </div>
                      )}
                      {totalClosedSessions && (
                        <div className="flex flex-col">
                          Won Carts
                          <div className="flex gap-2">
                            <ShoppingCart className="text-emerald-700" />
                            {totalClosedSessions.length}
                          </div>
                        </div>
                      )}
                    </>
                  }
                />
              </CardHeader>
            </Card>
          </div>

          <div className="flex gap-4 flex-col xl:!flex-row">
            <Card className="relative">
              <CardHeader>
                <CardDescription>Funnel Performance</CardDescription>
              </CardHeader>
              <CardContent className=" text-sm text-muted-foreground flex flex-col gap-12 justify-between ">
                <SubaccountFunnelChart data={funnelPerformanceMetrics} />
                <div className="lg:w-[150px]">
                  Total page visits across all funnels. Hover over to get more
                  details on funnel page performance.
                </div>
              </CardContent>
              <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
            <Card className="p-4 flex-1">
              <CardHeader>
                <CardTitle>Checkout Activity</CardTitle>
              </CardHeader>
              <AreaChart
                className="text-sm stroke-primary"
                data={sessions || []}
                index="created"
                categories={['amount_total']}
                colors={['primary']}
                yAxisWidth={30}
                showAnimation={true}
              />
            </Card>
          </div>
          <div className="flex gap-4 xl:!flex-row flex-col">
            <Card className="p-4 flex-1 h-[450px] overflow-scroll relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Transition History
                  <BadgeDelta
                    className="rounded-xl bg-transparent"
                    deltaType="moderateIncrease"
                    isIncreasePositive={true}
                    size="xs"
                  >
                    +12.3%
                  </BadgeDelta>
                </CardTitle>
                <Table>
                  <TableHeader className="!sticky !top-0">
                    <TableRow>
                      <TableHead className="w-[300px]">Email</TableHead>
                      <TableHead className="w-[200px]">Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-medium truncate">
                    {totalClosedSessions
                      ? totalClosedSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              {session.customer_details?.email || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-500 dark:text-black">
                                Paid
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(session.created).toUTCString()}
                            </TableCell>

                            <TableCell className="text-right">
                              <small>{currency}</small>{' '}
                              <span className="text-emerald-500">
                                {session.amount_total}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      : 'No Data'}
                  </TableBody>
                </Table>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </BlurPage>
  )
}

export default SubaccountPageId
