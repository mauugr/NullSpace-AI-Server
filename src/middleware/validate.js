export const validate=(schema, target='body') => (req,res,next) => {
  const result=schema.safeParse(req[target]);
  if(!result.success) return res.status(400).json({success:false,error:'Invalid request',details:result.error.flatten()});
  req[target]=result.data; next();
};
